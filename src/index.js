import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initDb from './db';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import config from './configHttp';
import { keycloak, sessionData } from './config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

let app = express();

app.server = http.createServer(app);

app.use(morgan('dev'));

app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

app.use(sessionData);

app.use(keycloak.middleware());

app.set('trust proxy', true);

initDb( db => {

	const swaggerDefinition = YAML.load('./src/spec-api.yaml');

	app.use("/permissions-api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition, { explorer: true }));

	app.use('/user', userRoutes({ config, db, keycloak }));

	app.use('/admin', adminRoutes({ config, db, keycloak }));

	app.server.listen(process.env.PORT || config.port, () => {
		console.log(`Started on port ${app.server.address().port}`);
	});

});

export default app;
