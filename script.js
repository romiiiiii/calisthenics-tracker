let workouts = JSON.parse(localStorage.getItem("workouts")) || [];
let currentSession = JSON.parse(localStorage.getItem("currentSession")) || [];

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("open");
  }
}

// Close burger menu when clicking outside
document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const burger = document.querySelector(".burger");

  if (!sidebar || !burger) return;

  const clickedInsideSidebar = sidebar.contains(event.target);
  const clickedBurger = burger.contains(event.target);

  if (!clickedInsideSidebar && !clickedBurger) {
    sidebar.classList.remove("open");
  }
});

function saveData() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
  localStorage.setItem("currentSession", JSON.stringify(currentSession));
}

function addWorkoutToSession() {
  const weekInput = document.getElementById("week");
  const dayInput = document.getElementById("day");
  const exerciseInput = document.getElementById("exercise");
  const setsInput = document.getElementById("sets");
  const repsInput = document.getElementById("reps");
  const notesInput = document.getElementById("notes");

  if (!weekInput || !dayInput || !exerciseInput || !setsInput || !repsInput || !notesInput) {
    return;
  }

  const week = weekInput.value.trim();
  const day = dayInput.value;
  const exercise = exerciseInput.value.trim();
  const sets = setsInput.value.trim();
  const reps = repsInput.value.trim();
  const notes = notesInput.value.trim();

  const exerciseRegex = /^[A-Za-z\s\-]+$/;

  if (week === "" || day === "" || exercise === "" || sets === "" || reps === "") {
    alert("Please fill in all required fields.");
    return;
  }

  if (!exerciseRegex.test(exercise)) {
    alert("Exercise name should contain only letters, spaces, or hyphens.");
    return;
  }

  if (isNaN(week) || isNaN(sets) || isNaN(reps)) {
    alert("Week, sets, and reps must be numbers.");
    return;
  }

  const workout = {
    week: Number(week),
    day,
    exercise,
    sets: Number(sets),
    reps: Number(reps),
    notes
  };

  currentSession.push(workout);
  saveData();
  displayCurrentSession();

  weekInput.value = "";
  dayInput.value = "";
  exerciseInput.value = "";
  setsInput.value = "";
  repsInput.value = "";
  notesInput.value = "";
}

function displayCurrentSession() {
  const sessionList = document.getElementById("sessionList");
  if (!sessionList) return;

  sessionList.innerHTML = "";

  if (currentSession.length === 0) {
    sessionList.innerHTML = `<p class="empty-message">No workouts added yet.</p>`;
    return;
  }

  currentSession.forEach((w, index) => {
    const item = document.createElement("div");
    item.className = "session-item";
    item.innerHTML = `
      <div>
        <strong>Week ${w.week}</strong> - ${w.day}<br>
        ${w.exercise} | ${w.sets} sets x ${w.reps} reps<br>
        ${w.notes ? `<em>Notes:</em> ${w.notes}` : ""}
      </div>
      <button class="delete-btn" onclick="removeFromSession(${index})">✕</button>
    `;
    sessionList.appendChild(item);
  });
}

function removeFromSession(index) {
  currentSession.splice(index, 1);
  saveData();
  displayCurrentSession();
}

function saveSessionToLog() {
  if (currentSession.length === 0) {
    alert("Your current workout session is empty.");
    return;
  }

  workouts.push(...currentSession);
  currentSession = [];
  saveData();
  displayCurrentSession();
  updateWeekFilter();
  displayWorkoutLog();
  updateStats();
  updateProgressPage();
  alert("Workout session saved to your diary 💕");
}

function displayWorkoutLog() {
  const workoutList = document.getElementById("workoutList");
  const weekFilter = document.getElementById("weekFilter");

  if (!workoutList) return;

  let filteredWorkouts = workouts;

  if (weekFilter && weekFilter.value !== "all") {
    filteredWorkouts = workouts.filter(w => w.week === Number(weekFilter.value));
  }

  workoutList.innerHTML = "";

  if (filteredWorkouts.length === 0) {
    workoutList.innerHTML = `<p class="empty-message">No workouts found.</p>`;
    return;
  }

  filteredWorkouts.forEach((w) => {
    const originalIndex = workouts.indexOf(w);
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <div>
        <strong>Week ${w.week}</strong> - ${w.day}<br>
        ${w.exercise} | ${w.sets} sets x ${w.reps} reps<br>
        ${w.notes ? `<em>Notes:</em> ${w.notes}` : ""}
      </div>
      <button class="delete-btn" onclick="deleteWorkout(${originalIndex})">✕</button>
    `;
    workoutList.appendChild(item);
  });
}

function deleteWorkout(index) {
  workouts.splice(index, 1);
  saveData();
  updateWeekFilter();
  displayWorkoutLog();
  updateStats();
  updateProgressPage();
}

function updateWeekFilter() {
  const weekFilter = document.getElementById("weekFilter");
  if (!weekFilter) return;

  const currentValue = weekFilter.value;
  const uniqueWeeks = [...new Set(workouts.map(w => w.week))].sort((a, b) => a - b);

  weekFilter.innerHTML = `<option value="all">All Weeks</option>`;

  uniqueWeeks.forEach(week => {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = `Week ${week}`;
    weekFilter.appendChild(option);
  });

  if ([...weekFilter.options].some(option => option.value === currentValue)) {
    weekFilter.value = currentValue;
  }
}

function updateStats() {
  const totalWorkouts = document.getElementById("totalWorkouts");
  const totalSets = document.getElementById("totalSets");
  const totalReps = document.getElementById("totalReps");

  if (!totalWorkouts || !totalSets || !totalReps) return;

  totalWorkouts.textContent = workouts.length;
  totalSets.textContent = workouts.reduce((sum, w) => sum + w.sets, 0);
  totalReps.textContent = workouts.reduce((sum, w) => sum + w.reps, 0);
}

function generatePlan() {
  const goal = document.getElementById("goal");
  const level = document.getElementById("level");
  const daysPerWeek = document.getElementById("daysPerWeek");

  if (!goal || !level || !daysPerWeek) return;

  const goalValue = goal.value;
  const levelValue = level.value;
  const daysValue = Number(daysPerWeek.value);

  if (!goalValue || !levelValue || !daysValue) {
    alert("Please select goal, level, and training days.");
    return;
  }

  let plan = [];

  if (goalValue === "strength" && levelValue === "beginner") {
    plan = [
      {
        day: "Day 1",
        exercises: [
          { exercise: "Push-Ups", sets: 3, reps: 8, notes: "" },
          { exercise: "Australian Pull-Ups", sets: 3, reps: 8, notes: "" },
          { exercise: "Squats", sets: 3, reps: 12, notes: "" },
          { exercise: "Plank", sets: 3, reps: 30, notes: "seconds" }
        ]
      },
      {
        day: "Day 2",
        exercises: [
          { exercise: "Pike Push-Ups", sets: 3, reps: 6, notes: "" },
          { exercise: "Dips", sets: 3, reps: 6, notes: "" },
          { exercise: "Lunges", sets: 3, reps: 10, notes: "each leg" },
          { exercise: "Hollow Hold", sets: 3, reps: 20, notes: "seconds" }
        ]
      },
      {
        day: "Day 3",
        exercises: [
          { exercise: "Push-Ups", sets: 3, reps: 10, notes: "" },
          { exercise: "Rows", sets: 3, reps: 8, notes: "" },
          { exercise: "Squats", sets: 3, reps: 15, notes: "" },
          { exercise: "Plank", sets: 3, reps: 40, notes: "seconds" }
        ]
      },
      {
        day: "Day 4",
        exercises: [
          { exercise: "Mobility Flow", sets: 1, reps: 15, notes: "minutes" },
          { exercise: "Core Work", sets: 3, reps: 12, notes: "" }
        ]
      }
    ];
  } else if (goalValue === "skills" && levelValue === "beginner") {
    plan = [
      {
        day: "Day 1",
        exercises: [
          { exercise: "Scapula Pulls", sets: 3, reps: 8, notes: "" },
          { exercise: "Knee Raises", sets: 3, reps: 10, notes: "" },
          { exercise: "Plank", sets: 3, reps: 30, notes: "seconds" }
        ]
      },
      {
        day: "Day 2",
        exercises: [
          { exercise: "Pike Push-Ups", sets: 3, reps: 6, notes: "" },
          { exercise: "Wall Hold", sets: 3, reps: 20, notes: "seconds" },
          { exercise: "Hollow Body Hold", sets: 3, reps: 20, notes: "seconds" }
        ]
      },
      {
        day: "Day 3",
        exercises: [
          { exercise: "Australian Pull-Ups", sets: 3, reps: 8, notes: "" },
          { exercise: "Push-Ups", sets: 3, reps: 8, notes: "" },
          { exercise: "L-Sit Tuck Hold", sets: 3, reps: 10, notes: "seconds" }
        ]
      },
      {
        day: "Day 4",
        exercises: [
          { exercise: "Mobility", sets: 1, reps: 15, notes: "minutes" },
          { exercise: "Balance Practice", sets: 3, reps: 5, notes: "" }
        ]
      }
    ];
  } else {
    plan = [
      {
        day: "Day 1",
        exercises: [
          { exercise: "Push-Ups", sets: 3, reps: 10, notes: "" },
          { exercise: "Squats", sets: 3, reps: 15, notes: "" }
        ]
      },
      {
        day: "Day 2",
        exercises: [
          { exercise: "Pull-Ups", sets: 3, reps: 5, notes: "" },
          { exercise: "Plank", sets: 3, reps: 30, notes: "seconds" }
        ]
      },
      {
        day: "Day 3",
        exercises: [
          { exercise: "Dips", sets: 3, reps: 6, notes: "" },
          { exercise: "Lunges", sets: 3, reps: 10, notes: "each leg" }
        ]
      },
      {
        day: "Day 4",
        exercises: [
          { exercise: "Core Work", sets: 3, reps: 12, notes: "" },
          { exercise: "Mobility", sets: 1, reps: 15, notes: "minutes" }
        ]
      }
    ];
  }

  const trimmedPlan = plan.slice(0, daysValue);
  localStorage.setItem("generatedPlan", JSON.stringify(trimmedPlan));
  window.location.href = "routine-details.html";
}

function getBestRepsForExercise(exerciseName) {
  const matchingWorkouts = workouts.filter(
    w => w.exercise.toLowerCase() === exerciseName.toLowerCase()
  );

  if (matchingWorkouts.length === 0) return 0;

  return Math.max(...matchingWorkouts.map(w => w.reps));
}

function updateProgressPage() {
  const bestPushupsEl = document.getElementById("bestPushups");
  const bestPullupsEl = document.getElementById("bestPullups");
  const bestDipsEl = document.getElementById("bestDips");
  const pullupProgressFill = document.getElementById("pullupProgressFill");
  const pullupProgressText = document.getElementById("pullupProgressText");
  const pullupMessage = document.getElementById("pullupMessage");

  if (
    !bestPushupsEl ||
    !bestPullupsEl ||
    !bestDipsEl ||
    !pullupProgressFill ||
    !pullupProgressText ||
    !pullupMessage
  ) {
    return;
  }

  const bestPushups = getBestRepsForExercise("Push-Ups");
  const bestPullups = getBestRepsForExercise("Pull-Ups");
  const bestDips = getBestRepsForExercise("Dips");

  bestPushupsEl.textContent = bestPushups;
  bestPullupsEl.textContent = bestPullups;
  bestDipsEl.textContent = bestDips;

  const pullupGoal = 1;
  let progressPercent = Math.min((bestPullups / pullupGoal) * 100, 100);

  if (bestPullups === 0) {
    progressPercent = 10;
    pullupMessage.textContent = "Your first pull-up is loading… and every step you're taking is getting you closer 💕";
    pullupProgressText.textContent = "Your glow-up has officially started ✨";
  } else if (bestPullups >= 1) {
    pullupMessage.textContent = "You did your first pull-up 😭💪 this is your main character moment.";
    pullupProgressText.textContent = "100% complete — and this is just the beginning 🎀";
  } else {
    pullupMessage.textContent = "You’re getting closer to your first pull-up — keep showing up.";
    pullupProgressText.textContent = `${Math.round(progressPercent)}% of your first pull-up goal`;
  }

  pullupProgressFill.style.width = `${progressPercent}%`;
}

function displayRoutineDetails() {
  const container = document.getElementById("routineDetails");
  if (!container) return;

  const plan = JSON.parse(localStorage.getItem("generatedPlan")) || [];
  container.innerHTML = "";

  if (plan.length === 0) {
    container.innerHTML = `<p class="empty-message">No routine generated yet.</p>`;
    return;
  }

  plan.forEach((dayPlan, dayIndex) => {
    const dayCard = document.createElement("div");
    dayCard.className = "goal-card";

    let exercisesHtml = `
      <h2 style="margin-top:0;">${dayPlan.day}</h2>
      <p style="text-align:center; margin-bottom:15px;">
        Edit this day or start it when you're ready 💕
      </p>
    `;

    exercisesHtml += dayPlan.exercises.map((ex, exIndex) => `
      <div class="log-item">
        <div style="width:100%; display:flex; flex-direction:column; gap:10px;">
          <input type="text" value="${ex.exercise}" id="exercise-${dayIndex}-${exIndex}" placeholder="Exercise name">
          <input type="number" value="${ex.sets}" id="sets-${dayIndex}-${exIndex}" placeholder="Sets">
          <input type="number" value="${ex.reps}" id="reps-${dayIndex}-${exIndex}" placeholder="Target reps">
          <input type="text" value="${ex.notes}" id="notes-${dayIndex}-${exIndex}" placeholder="Notes / easier version / injury note">
        </div>
      </div>
    `).join("");

    exercisesHtml += `
      <div style="margin-top:15px; text-align:center;">
        <button onclick="openDayWorkout(${dayIndex})">Start ${dayPlan.day}</button>
      </div>
    `;

    dayCard.innerHTML = exercisesHtml;
    container.appendChild(dayCard);
  });
}

function saveEditedRoutine() {
  const plan = JSON.parse(localStorage.getItem("generatedPlan")) || [];

  plan.forEach((dayPlan, dayIndex) => {
    dayPlan.exercises.forEach((ex, exIndex) => {
      ex.exercise = document.getElementById(`exercise-${dayIndex}-${exIndex}`).value.trim();
      ex.sets = Number(document.getElementById(`sets-${dayIndex}-${exIndex}`).value);
      ex.reps = Number(document.getElementById(`reps-${dayIndex}-${exIndex}`).value);
      ex.notes = document.getElementById(`notes-${dayIndex}-${exIndex}`).value.trim();
    });
  });

  localStorage.setItem("generatedPlan", JSON.stringify(plan));
  alert("Your routine was updated 💕");
}

function openDayWorkout(dayIndex) {
  const plan = JSON.parse(localStorage.getItem("generatedPlan")) || [];

  if (!plan[dayIndex]) {
    alert("Day not found.");
    return;
  }

  localStorage.setItem("selectedWorkoutDay", JSON.stringify({
    dayIndex: dayIndex,
    dayData: plan[dayIndex]
  }));

  window.location.href = "day-workout.html";
}

function displayDayWorkout() {
  const container = document.getElementById("dayWorkoutContainer");
  if (!container) return;

  const selected = JSON.parse(localStorage.getItem("selectedWorkoutDay"));

  if (!selected || !selected.dayData) {
    container.innerHTML = `<p class="empty-message">No workout day selected yet.</p>`;
    return;
  }

  const dayData = selected.dayData;

  container.innerHTML = `
    <div class="goal-card">
      <h2 style="margin-top:0;">${dayData.day}</h2>
      <p>Complete your exercises and log what you actually managed today.</p>
    </div>
  `;

  dayData.exercises.forEach((exercise, exerciseIndex) => {
    const exerciseCard = document.createElement("div");
    exerciseCard.className = "goal-card";
    exerciseCard.id = `exercise-card-${exerciseIndex}`;

    let setInputs = "";
    for (let i = 0; i < exercise.sets; i++) {
      setInputs += `
        <label style="display:block; margin-top:10px; text-align:left;">
          Set ${i + 1} actual reps:
          <input type="number" id="actual-${exerciseIndex}-${i}" placeholder="Enter reps completed">
        </label>
      `;
    }

    exerciseCard.innerHTML = `
      <h2 style="margin-top:0;">${exercise.exercise}</h2>
      <p><strong>Target:</strong> ${exercise.sets} sets x ${exercise.reps} reps</p>
      ${exercise.notes ? `<p><strong>Notes:</strong> ${exercise.notes}</p>` : ""}
      ${setInputs}
      <label style="display:block; margin-top:12px; text-align:left;">
        Extra notes:
        <input type="text" id="extra-notes-${exerciseIndex}" placeholder="How did it feel? Injury? Easier version?">
      </label>
      <div style="margin-top:15px;">
        <button id="done-btn-${exerciseIndex}" onclick="markExerciseDone(${exerciseIndex})">Done</button>
      </div>
    `;

    container.appendChild(exerciseCard);
  });
}

function markExerciseDone(exerciseIndex) {
  const selected = JSON.parse(localStorage.getItem("selectedWorkoutDay"));

  if (!selected || !selected.dayData) {
    alert("No workout day selected.");
    return;
  }

  const dayData = selected.dayData;
  const exercise = dayData.exercises[exerciseIndex];

  let actualReps = [];
  for (let i = 0; i < exercise.sets; i++) {
    const input = document.getElementById(`actual-${exerciseIndex}-${i}`);
    const value = input ? input.value.trim() : "";

    if (value === "") {
      actualReps.push(0);
    } else {
      actualReps.push(Number(value));
    }
  }

  const extraNotesInput = document.getElementById(`extra-notes-${exerciseIndex}`);
  const extraNotes = extraNotesInput ? extraNotesInput.value.trim() : "";

  const totalActualReps = actualReps.reduce((sum, reps) => sum + reps, 0);

  const completedWorkout = {
    week: 1,
    day: dayData.day,
    exercise: exercise.exercise,
    sets: exercise.sets,
    reps: totalActualReps,
    notes: `Target: ${exercise.sets} x ${exercise.reps}. Actual sets: ${actualReps.join(", ")}${extraNotes ? " | " + extraNotes : ""}`
  };

  workouts.push(completedWorkout);
  saveData();
  updateWeekFilter();
  updateStats();
  updateProgressPage();

  const card = document.getElementById(`exercise-card-${exerciseIndex}`);
  const button = document.getElementById(`done-btn-${exerciseIndex}`);

  if (card) {
    card.classList.add("completed-card");
  }

  if (button) {
    button.textContent = "Done ✓";
    button.disabled = true;
    button.classList.add("done-state");
  }

  alert(`${exercise.exercise} saved to your progress diary 💕`);
}
function getBestRepsForExercise(exerciseName) {
  const matchingWorkouts = workouts.filter(
    w => w.exercise.toLowerCase() === exerciseName.toLowerCase()
  );

  if (matchingWorkouts.length === 0) return 0;

  return Math.max(...matchingWorkouts.map(w => w.reps));
}

function displayWeeklyDashboard() {
  const weekDaysGrid = document.getElementById("weekDaysGrid");
  const currentWeekTitle = document.getElementById("currentWeekTitle");

  if (!weekDaysGrid || !currentWeekTitle) return;

  const plan = JSON.parse(localStorage.getItem("generatedPlan")) || [];
  const currentWeek = 1;

  currentWeekTitle.textContent = `Week ${currentWeek}`;
  weekDaysGrid.innerHTML = "";

  if (plan.length === 0) {
    weekDaysGrid.innerHTML = `
      <div class="goal-card">
        <p class="empty-message">No routine yet. Go to <strong>My Routine</strong> and generate your week first 💕</p>
      </div>
    `;
    return;
  }

  plan.forEach((dayPlan, dayIndex) => {
    const alreadyDone = workouts.some(w => w.day === dayPlan.day);

    const card = document.createElement("div");
    card.className = "day-card";

    card.innerHTML = `
      <h3>${dayPlan.day}</h3>
      <span class="day-status ${alreadyDone ? "status-done" : "status-not-started"}">
        ${alreadyDone ? "Done ✓" : "Not Started"}
      </span>
      <p>${dayPlan.exercises.length} exercises planned</p>
      <button onclick="openDayWorkout(${dayIndex})">
        ${alreadyDone ? "Open Again" : "Start Workout"}
      </button>
    `;

    weekDaysGrid.appendChild(card);
  });
}

function updateHomeStats() {
  const totalWorkouts = document.getElementById("totalWorkouts");
  const bestPushups = document.getElementById("bestPushups");
  const bestPullups = document.getElementById("bestPullups");

  if (totalWorkouts) {
    totalWorkouts.textContent = workouts.length;
  }

  if (bestPushups) {
    bestPushups.textContent = getBestRepsForExercise("Push-Ups");
  }

  if (bestPullups) {
    bestPullups.textContent = getBestRepsForExercise("Pull-Ups");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  displayCurrentSession();
  updateWeekFilter();
  displayWorkoutLog();
  updateStats();
  updateProgressPage();
  displayRoutineDetails();
  displayDayWorkout();
  displayWeeklyDashboard();
  updateHomeStats();
});