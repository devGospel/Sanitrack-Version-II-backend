// import Task from "../models/task";
// import jsonData from '../cook_room_facility2_dummy_data.json'
// import fruitRoomData from '../fruit_room_facility2_dummy_data.json'
// import labRoom from '../lab_room_facility2_dummy_data.json'
// import productionRoom from '../production_room_facility2_dummy_data.json'
// import roomFour from '../room4_room_facility2_dummy_data.json'
// import saladRoom from '../salad_room_facility2_dummy_data.json'
// import storeRoom from '../store_room_facility2_dummy_data.json'
// import fruitRoom from '../fruit_room_facility200_dummy_data.json'
export const importData = async () => {
    try {
        // await Task.insertMany(jsonData);
        // await Task.insertMany(storeRoom); 
        // await Task.insertMany(saladRoom);
        // await Task.insertMany(roomFour); 
        // await Task.insertMany(productionRoom)
        // await Task.insertMany(labRoom); 
        // await Task.insertMany(fruitRoomData)
        // await Task.insertMany(fruitRoom)
  
        console.log('Data imported successfully');
    } catch (error) {
        console.error('Error importing data:', error);
    }
}