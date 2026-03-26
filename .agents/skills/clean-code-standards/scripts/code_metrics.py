#!/usr/bin/env python3
"""
Lightweight code metrics for clean-code reviews.

Supports Python exactly enough to read functions from the AST and estimate
cyclomatic complexity from decision nodes. Supports JS/TS-family files with
heuristic parsing based on braces and function signatures.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


DEFAULT_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx"}
DEFAULT_EXCLUDES = {
    ".git",
    ".generated",
    ".next",
    ".nuxt",
    ".turbo",
    ".idea",
    ".vscode",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "tmp",
}

RESERVED_METHOD_NAMES = {
    "catch",
    "else",
    "for",
    "if",
    "switch",
    "try",
    "while",
}


@dataclass
class FunctionMetric:
    name: str
    start_line: int
    end_line: int
    length: int
    complexity: int
    nesting_depth: int


@dataclass
class FileMetric:
    path: str
    language: str
    line_count: int
    max_complexity: int
    max_nesting_depth: int
    flagged_file_length: bool
    functions: list[FunctionMetric]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit repository code metrics.")
    parser.add_argument("paths", nargs="+", help="Files or directories to inspect.")
    parser.add_argument("--file-lines", type=int, default=500)
    parser.add_argument("--function-lines", type=int, default=50)
    parser.add_argument("--complexity", type=int, default=10)
    parser.add_argument("--nesting", type=int, default=4)
    parser.add_argument("--json", action="store_true", help="Emit JSON output.")
    return parser.parse_args()


def iter_files(paths: Iterable[str]) -> Iterable[Path]:
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_file() and path.suffix in DEFAULT_EXTENSIONS:
            yield path
            continue
        if not path.is_dir():
            continue
        for file_path in path.rglob("*"):
            if not file_path.is_file() or file_path.suffix not in DEFAULT_EXTENSIONS:
                continue
            if any(part in DEFAULT_EXCLUDES for part in file_path.parts):
                continue
            yield file_path


def complexity_from_text(text: str) -> int:
    complexity = 1
    complexity += len(re.findall(r"\bif\b|\belif\b|\bfor\b|\bwhile\b|\bexcept\b|\bcase\b|\bcatch\b", text))
    complexity += len(re.findall(r"&&|\|\|", text))
    complexity += text.count("?")
    return complexity


class PythonFunctionVisitor(ast.NodeVisitor):
    def __init__(self, source_lines: list[str]) -> None:
        self.source_lines = source_lines
        self.metrics: list[FunctionMetric] = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.metrics.append(self._metric_for_function(node))
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self.metrics.append(self._metric_for_function(node))
        self.generic_visit(node)

    def _metric_for_function(self, node: ast.AST) -> FunctionMetric:
        start_line = getattr(node, "lineno", 1)
        end_line = getattr(node, "end_lineno", start_line)
        length = end_line - start_line + 1
        complexity = 1
        max_depth = 0

        def walk(inner: ast.AST, depth: int) -> None:
            nonlocal complexity, max_depth
            children = list(ast.iter_child_nodes(inner))
            branch_nodes = (
                ast.If,
                ast.For,
                ast.AsyncFor,
                ast.While,
                ast.Try,
                ast.IfExp,
                ast.ExceptHandler,
                ast.Match,
            )
            if isinstance(inner, branch_nodes):
                complexity += 1
                max_depth = max(max_depth, depth + 1)
                next_depth = depth + 1
            elif isinstance(inner, ast.BoolOp):
                complexity += max(0, len(inner.values) - 1)
                next_depth = depth
            else:
                next_depth = depth
            for child in children:
                walk(child, next_depth)

        for child in ast.iter_child_nodes(node):
            walk(child, 0)

        return FunctionMetric(
            name=getattr(node, "name", "<anonymous>"),
            start_line=start_line,
            end_line=end_line,
            length=length,
            complexity=complexity,
            nesting_depth=max_depth,
        )


def analyze_python(path: Path, text: str) -> FileMetric:
    tree = ast.parse(text)
    visitor = PythonFunctionVisitor(text.splitlines())
    visitor.visit(tree)
    functions = visitor.metrics
    return FileMetric(
        path=str(path),
        language="python",
        line_count=len(text.splitlines()),
        max_complexity=max((fn.complexity for fn in functions), default=0),
        max_nesting_depth=max((fn.nesting_depth for fn in functions), default=0),
        flagged_file_length=False,
        functions=functions,
    )


FUNCTION_START_RE = re.compile(
    r"""
    ^(?P<indent>\s*)
    (?:
        (?:export\s+)?(?:async\s+)?function\s+(?P<func_name>[A-Za-z0-9_$]+)
      | (?:const|let|var)\s+(?P<var_name>[A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z0-9_$]+\s*=>)
      | (?P<method_name>[A-Za-z0-9_$]+)\s*\([^;]*\)\s*\{
    )
    """,
    re.VERBOSE,
)


def extract_js_functions(path: Path, text: str) -> list[FunctionMetric]:
    lines = text.splitlines()
    functions: list[FunctionMetric] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        match = FUNCTION_START_RE.match(line)
        if not match:
            index += 1
            continue
        name = match.group("func_name") or match.group("var_name") or match.group("method_name") or "<anonymous>"
        if name in RESERVED_METHOD_NAMES:
            index += 1
            continue
        start_line = index + 1
        brace_balance = line.count("{") - line.count("}")
        collected = [line]
        index += 1
        while index < len(lines) and brace_balance > 0:
            current = lines[index]
            collected.append(current)
            brace_balance += current.count("{") - current.count("}")
            index += 1
        body = "\n".join(collected)
        complexity = complexity_from_text(body)
        nesting_depth = estimate_nesting_depth(collected)
        functions.append(
            FunctionMetric(
                name=name,
                start_line=start_line,
                end_line=start_line + len(collected) - 1,
                length=len(collected),
                complexity=complexity,
                nesting_depth=nesting_depth,
            )
        )
    return functions


def estimate_nesting_depth(lines: list[str]) -> int:
    depth = 0
    max_depth = 0
    for line in lines:
        opens = line.count("{")
        closes = line.count("}")
        depth += opens
        max_depth = max(max_depth, depth)
        depth -= closes
        depth = max(depth, 0)
    return max(0, max_depth - 1)


def analyze_js_family(path: Path, text: str) -> FileMetric:
    functions = extract_js_functions(path, text)
    return FileMetric(
        path=str(path),
        language="js-family",
        line_count=len(text.splitlines()),
        max_complexity=max((fn.complexity for fn in functions), default=0),
        max_nesting_depth=max((fn.nesting_depth for fn in functions), default=0),
        flagged_file_length=False,
        functions=functions,
    )


def analyze_file(path: Path) -> FileMetric | None:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError, SyntaxError):
        return None
    if path.suffix == ".py":
        try:
            return analyze_python(path, text)
        except SyntaxError:
            return None
    return analyze_js_family(path, text)


def render_text(metrics: list[FileMetric], thresholds: argparse.Namespace) -> str:
    lines: list[str] = []
    for metric in metrics:
        file_flag = metric.line_count > thresholds.file_lines
        flagged_functions = [
            fn
            for fn in metric.functions
            if fn.length > thresholds.function_lines
            or fn.complexity > thresholds.complexity
            or fn.nesting_depth > thresholds.nesting
        ]
        if not file_flag and not flagged_functions:
            continue
        lines.append(
            f"{metric.path}: lines={metric.line_count}, max_complexity={metric.max_complexity}, max_nesting={metric.max_nesting_depth}"
        )
        if file_flag:
            lines.append(f"  file exceeds {thresholds.file_lines} lines")
        for fn in flagged_functions:
            lines.append(
                "  "
                + f"{fn.name} [{fn.start_line}-{fn.end_line}] "
                + f"lines={fn.length} complexity={fn.complexity} nesting={fn.nesting_depth}"
            )
    return "\n".join(lines) if lines else "No threshold violations found."


def main() -> int:
    args = parse_args()
    results: list[FileMetric] = []
    for path in sorted(set(iter_files(args.paths))):
        metric = analyze_file(path)
        if metric is None:
            continue
        metric.flagged_file_length = metric.line_count > args.file_lines
        results.append(metric)

    results.sort(
        key=lambda item: (
            not item.flagged_file_length,
            -item.max_complexity,
            -item.max_nesting_depth,
            -item.line_count,
            item.path,
        )
    )

    if args.json:
        print(json.dumps([asdict(item) for item in results], indent=2))
    else:
        print(render_text(results, args))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
