/*
var config = {
	host: '202.28.68.11',
	user: 'sasurean',
	database: 'shopdb', 
	password: 'drinking', 
	port: 1486, 
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
*/
//var pool = new pg.Pool(config);


const { Pool } = require('pg');
const dbconfig = require('./dbconfig');
const pool = new Pool( dbconfig);


(async () => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
	var stringQueryShop = "select * from shop order by id";
	const { rows } = await client.query(stringQueryShop);
	console.log(JSON.stringify(rows));
	//response.status(200).send(rows.rows);
	/*
    const { rows } = await client.query('INSERT INTO users(name) VALUES($1) RETURNING id', ['brianc']);

    const insertPhotoText = 'INSERT INTO photos(user_id, photo_url) VALUES ($1, $2)';
    const insertPhotoValues = [res.rows[0].id, 's3.bucket.foo'];
    await client.query(insertPhotoText, insertPhotoValues);
	*/ 
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
})().catch(e => console.error(e.stack));

/*
https://node-postgres.com/features/transactions
https://linuxhint.com/postgresql-nodejs-tutorial/
http://www.javascriptpoint.com/nodejs-postgresql-tutorial-example/
*/