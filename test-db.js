import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_XkYol9BWb2MT@ep-wispy-star-accoulws-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  const res = await pool.query(
    "SELECT id, nome, token FROM caixas_entrada WHERE agregador = 'hive'"
  );
  console.log(res.rows);
  await pool.end();
}
run();
