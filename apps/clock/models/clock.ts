import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

class Clock {
    //generate date field
    @prop({ required: true })
    target_id: string;
    @prop({ required: true })
    end_date: Date;
}

async function createModel(target: string, date: Date) {
    const clock = getModelForClass(Clock);
    await clock.create({target_id: target, end_date: date}, (err: Error, doc: any) => {
        if (err) {
            console.error(err);
        }
        console.log(doc);
    });
}

async function getModelById(target_id: string): Promise<Clock | null>{
    const clock = getModelForClass(Clock);
    const result = clock.find({target_id}, (err: Error, doc: any) => {
        if (err) {
            console.error(err);
        }
        console.log(doc);
        return doc;
    });

    return null;
}

async function getAllModels(): Promise<Clock[] | null> {
    const clock = getModelForClass(Clock);
    const result = clock.find({}, (err: Error, doc: Clock[]) => {
        if (err) {
            console.error(err);
        }
        console.log(doc);
        return doc;
    });
    return null;
}

export { createModel, getModelById, getAllModels };