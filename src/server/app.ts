import express from 'express';
import cors from 'cors';
import availabilityRouter from './routes/availability';
import inputSchemaRouter from './routes/input-schema';
import startJobRouter from './routes/start-job';
import statusRouter from './routes/status';
import provideInputRouter from './routes/provide-input';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors());
app.use(express.json());

app.use(availabilityRouter);
app.use(inputSchemaRouter);
app.use(startJobRouter);
app.use(statusRouter);
app.use(provideInputRouter);

app.use(errorHandler);

export default app;
