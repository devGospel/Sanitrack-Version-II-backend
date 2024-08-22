import mongoose, { Document, Schema } from 'mongoose';
import User from './user';
import Role from './role';

interface Logs extends Document{ 
    timestamp: Date,
  ip: String,
  host: String,
  method: String,
  url: String,
  fields: String,
  query: String,
  params: String,
  userId: mongoose.Types.ObjectId,
  userRole: mongoose.Types.ObjectId,
  statusCode: String,
  permissionName: String, 
  errorMessage: String, 
  responseMessage: String,
}

const logSchema = new Schema<Logs>({
    timestamp: { type: Date, default: Date.now, required: true },
    ip: {type: String, require: true},
    host:{type: String, require: true}, 
    method: {type: String, require: true}, 
    url: {type: String, require: true},
    fields: {type: String, require: true},  
    query: {type: String, require: true}, 
    params: {type: String, require: true}, 
    userId: {type: mongoose.Schema.Types.ObjectId, ref:User, require: true}, 
    userRole: {type: mongoose.Schema.Types.ObjectId, ref: Role, require: true}, 
    statusCode: {type: String, require: true},  
    permissionName: {type: String, require: true},
    errorMessage: {type:String, require:true}, 
    responseMessage: {type:String, require:true},
})

const auditLogs = mongoose.model<Logs>('Audit', logSchema)

export default auditLogs