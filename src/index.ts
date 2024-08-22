import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { middleware } from './middlewares/security';
import customResponse from './helpers/response';
import routes from './routes/index'
import routeV1 from './routes/v1/index'
import swagger from './config/swagger';
import auditMiddleware from './middlewares/audit';
import responseMessageMiddleware from './middlewares/response';
import helmet from 'helmet';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import httpmiddleware from 'i18next-http-middleware';
import path from 'path';
import mongoSanitize  from "express-mongo-sanitize"
import { createChildLogger } from './utils/childLogger';
import router from './routes/index';
import ApiError from './utils/apiError';
// Load environment variables from a .env file

const moduleName = '[index]'
const Logger = createChildLogger(moduleName)

// Locale initialization
i18next
	.use(Backend)
	.use(httpmiddleware.LanguageDetector)
	.init({
		fallbackLng: 'en',
		supportedLngs: ['en','fr', 'es', 'gr', 'rs'],
		ns: ['translation'],
		defaultNS: 'translation',
		backend: {
			loadPath: path.join(__dirname, '/locales/{{lng}}/{{ns}}.json'),
		},
		detection: {
			lookupHeader: 'accept-language',
		},
		preload: ['en','fr', 'es', 'gr', 'rs'],
		keySeparator: '.',
	});


// Create an Express application
const app: Express = express();

app.use('/uploads', express.static('uploadsLMS'));

app.use(httpmiddleware.handle(i18next))
// Set security HTTP headers
app.use(helmet());

app.use(responseMessageMiddleware)

app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

// Parse JSON bodies in requests
app.use(express.json());

// Use body-parser to parse form-data
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// Remove all keys containing prohibited characters
app.use(mongoSanitize());


// Serve Swagger documentation at /api-docs using swagger-ui
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));

// Middleware for security measures
app.use(middleware);


// call the audit middleware
app.use(auditMiddleware)

// Use the defined routes for handling API requests
app.use(router)

app.get('/health', (req, res) => { 
    res.json({message: "Up and running ^_^ "})
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	Logger.error('error is happening here ', err)
	// next(new ApiError(500, err.message))
    return customResponse.serverErrorResponse(err.message, res, err);
});

// 404
/*app.use((req, res) => { 
    res.status(404).send("Invalid Route")
})*/

export default app;