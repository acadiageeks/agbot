import Postgres from 'pg';

class DatabasePool {

  constructor() {
      if (!DatabasePool.instance) {
        DatabasePool.instance = new Postgres.native.Pool({
          user: process.env.POSTGRES_USERNAME,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
          host: process.env.POSTGRES_HOST,
          port: process.env.POSTGRES_PORT
        });
      }
  }

  sharedInstance() {
      return DatabasePool.instance;
  }

}

export const pool = new DatabasePool().sharedInstance();
