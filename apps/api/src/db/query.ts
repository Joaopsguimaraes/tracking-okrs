import type { QueryResultRow } from 'pg';

import { pool } from './pool.js';

export const query = async <TRow extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<TRow[]> => {
  const result = await pool.query<TRow>(text, [...params]);
  return result.rows;
};
