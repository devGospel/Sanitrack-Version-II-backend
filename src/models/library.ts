import mongoose, { Document, Schema } from 'mongoose';

interface LibraryResource extends Document {
    thumbnailUrl: string;
    resourceTitle: string;
    resourceType: 'Article' | 'PDF' | 'Video';
    resourceUrl?: string[];
    article?: string;
}

const libraryResourceSchema = new Schema<LibraryResource>({
    thumbnailUrl: { type: String, required: true },
    resourceTitle: { type: String, required: true },
    resourceType: { type: String, required: true, enum: ['Article', 'PDF', 'Video'] },
    resourceUrl: { type: String, required: function() { return this.resourceType === 'PDF' || this.resourceType === 'Video'; }},
    article: { type: String, required: function() { return this.resourceType === 'Article'; }},
}, {
    timestamps: {
        createdAt: 'dateCreated'
    }
});

const LibraryResource = mongoose.model<LibraryResource>('LibraryResource', libraryResourceSchema);
export default LibraryResource;