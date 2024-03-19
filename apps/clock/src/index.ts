import { createModel, getAllModels } from '../models/clock';

console.log("clockservice has started...");

//connect to mongoose
import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/clock');

const currentModels = getAllModels();

if (currentModels) {
    currentModels.then((models) => {
      //check if date is expired
      if(models) {
        models.forEach((model) => {
            if (model.end_date < new Date()) {
                console.log(model)
            }
        });
      }
    });
}

createModel("hasj", new Date());


