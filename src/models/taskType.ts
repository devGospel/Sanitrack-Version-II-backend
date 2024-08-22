import mongoose, { Document, Schema, model } from 'mongoose';

interface TaskType extends Document {
    name: string;
    description?: string, 
    document?: string, 
    isDefault: Boolean
}

const taskTypeSchema = new Schema<TaskType>({ 
    name: {type: String, unique: true, required: true}, 
    description: {type: String, default: null, required: false}, 
    document: {type: String, default: null, required: false},
    isDefault: {type: Boolean, default: false, required: false}
})

const TaskTypeModel = model<TaskType>('task_type', taskTypeSchema)

export default TaskTypeModel