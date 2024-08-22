import mongoose, { connection } from 'mongoose';
import http from 'http';
import app from './index';
import { MONGODB_URI } from './constant/dburl';
import { createChildLogger } from './utils/childLogger';
import { importData } from './utils/importDummy';
import generateCookRoomDummyData from './utils/generateDummy';
import path from "path"
import fs from "fs"
import { initializeRoomCodes } from './autoIncrement';


const moduleName = '[server]'
const Logger = createChildLogger(moduleName)



// Define the port for the server to listen on
const PORT: number = parseInt(process.env.PORT || '5000', 10);

const server: http.Server = http.createServer(app); /*  */


// Connect to MongoDB
mongoose.connect(MONGODB_URI);
const conn = mongoose.connection;

conn.once('open', () => { 
  Logger.info('Database is connected')
  app.listen(PORT, () => {
    Logger.info(`Server is running on http://localhost:${PORT}/api-docs`);
  })
})


// Event handler for MongoDB connection error
mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
  // Handle the error appropriately (e.g., log, exit the application)
});

// initializeRoomCodes()//÷

const exitHandler = () => {
    if (server) {
      server.close(() => { 
        Logger.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }; 
  
  const unexpectedErrorHandler = (error: any) => {
    Logger.error(error);
    exitHandler();
  };
  
  process.on('uncaughtException', unexpectedErrorHandler);
  
  process.on('unhandledRejection', unexpectedErrorHandler);
  
  process.on('SIGTERM', () => {
    Logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
  });
  