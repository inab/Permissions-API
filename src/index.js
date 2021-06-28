import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initDb from './db';
import winston from 'winston';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import keysRoutes from './routes/keys';
import { keycloak, sessionData, serverConf } from './config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import 'express-async-errors';
import errors from './middleware/errors';
require('./logs')();

let app = express();

app.server = http.createServer(app);

app.use(morgan('dev'));

app.use(cors({
	exposedHeaders: serverConf.corsHeaders
}));

app.use(bodyParser.json({
	limit : serverConf.bodyLimit
}));

app.use(sessionData);

app.use(keycloak.middleware());

app.set('trust proxy', true);

initDb( db => {

	const swaggerDefinition = YAML.load('./src/spec-api.yaml');

	app.use("/permissions-api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition, { explorer: true }));

	app.use('/me', userRoutes({ serverConf, db, keycloak }));

	app.use('/permissions', adminRoutes({ serverConf, db, keycloak }));

	app.use('/jwks', keysRoutes());

	app.use(errors)

	app.server.listen(process.env.PORT || serverConf.port, () => {
		console.log(`Started on port ${app.server.address().port}`);
	});

});

export default app;
