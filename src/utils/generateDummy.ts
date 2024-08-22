import { faker } from "@faker-js/faker";
import { ProductionRoomDetailsFacilityTwo, LabRoomDetailFacilityTwo, StoreRoomDetailsFacilityThree, FruitRoomTasksFacilityOne, CookRoomDetailsFacilityOne, SaladRoomDetailsFacilityOne, roomFourDetailsFacilityOne } from "../roomsDetail";
import { Logger } from "./logger";

const FIXED_VALUES = {
  assigned_inspector: [
    "65e44b730872137740de21c0",
    "65dd9d91c87108564655ef5b",
    "65ddd926b483d001f2c3932c",
    "65df4fa0eb0ebe4e54f03c22",
  ],
  assigned_manager: "65a1f6274f6612fbb129692e",
  assigned_cleaner: [
    "65e44c5c0872137740de2340",
    "65d48b90b91921dedd5f4f99",
    "65d7777ab91921dedd6032b1",
    "65d8697eb91921dedd604c34",
    "65db40f50157e643df6efc27",
    "65dcb732e57e7be3acbda650",
    "65e08c1d53881eaa42adcef7",
    "65e08f477347beecf9d33470",
    "65e1b35a0f2ba5b2feca6562",
    "65e6d53f03b106dea17ea0f7",
  ],
  assigned_location: "65fd3e9c2f13d72d92d68200",
  assigned_room: "66062e38594ddc4fa1ac1062",
  planned_time: "660630f1594ddc4fa1ac184c",
};

const sampleTasks  = FruitRoomTasksFacilityOne

function generateTasksArray(currentDate: Date): any[] {
  // Shuffle the sampleTasks array to randomize the selection
  const shuffledTasks = faker.helpers.shuffle(sampleTasks);

  // Randomly select subset of shuffledTasks
  const numSubTasks = Math.floor(Math.random() * (shuffledTasks.length - 1)) + 1;
  const selectedTasks = shuffledTasks.slice(0, numSubTasks);

  selectedTasks.forEach((task) => {
    task.last_cleaned = currentDate as unknown as string;
  });

  return selectedTasks;
}

function generateCookRoomDummyData(): any[] {
  const tasks = [];
  // Iterate through each day of the year
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-03-21");
  let currentDate = startDate;

  let count = 0
  let isDOneF = 0
  let totalIsDoneF = 0
  while (currentDate <= endDate) {
    const generatedTasks = generateTasksArray(currentDate);

    // Randomly select one or multiple cleaners and inspectors
    const randomCleaners = faker.helpers
      .shuffle(FIXED_VALUES.assigned_cleaner)
      .slice(
        0,
        Math.floor(Math.random() * FIXED_VALUES.assigned_cleaner.length) + 1
      );
      const randomInspectors = faker.helpers.shuffle(FIXED_VALUES.assigned_inspector).slice(0, 2);

    let allTasksDone = true;
    for (const task of generatedTasks) {
        // Logger.info(`for date ${currentDate} task generated is ${JSON.stringify(task)}`)
        if (task.isDone == false) {
            isDOneF++
            Logger.info(`task.isDone false found => ${task}`)
            allTasksDone = false;
            break
        }
      
    }

    // Logger.info(`all task isDone => ${allTasksDone}`)
    let taskStage, isSubmitted;
    if (allTasksDone) {
        
      taskStage = "release";
      isSubmitted = true;
    } else {
      taskStage = Math.random() < 0.5 ? "clean" : "preop"; // Randomly choose between "clean" and "preop"
      isSubmitted = false;
      
    }

    // Add generated dummy data to tasks array
    tasks.push({
      assigned_inspector: randomInspectors,
      assigned_manager: FIXED_VALUES.assigned_manager,
      assigned_cleaner: randomCleaners,
      assigned_location: FIXED_VALUES.assigned_location,
      assigned_room: FIXED_VALUES.assigned_room,
      planned_time: FIXED_VALUES.planned_time,
      task_stage: taskStage, 
      isSubmitted: isSubmitted, 
      times_approved: 0, 
      date_added: currentDate,
      scheduled_date: currentDate, 
      date_approved: null, 
      tasks: generatedTasks, // Generate random number of tasks for each task
    });

    // Move to the next day
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    count++
    
  }
  Logger.info(`number of times loop ran => ${count}`)
  Logger.info(`total number of isDone properties => ${isDOneF}`)
  return tasks;
}

export default generateCookRoomDummyData;
