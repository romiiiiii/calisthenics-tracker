let workouts = [];
let currentSession = [];

const PUBLIC_PAGES = ["login.html"];
const PROFILES_STORAGE_KEY = "userProfiles";
const ACTIVE_PROFILE_KEY = "activeProfileKey";

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const burger = document.querySelector(".burger");

  if (!sidebar) return;

  const isOpen = sidebar.classList.toggle("open");

  if (burger) {
    burger.setAttribute("aria-expanded", String(isOpen));
  }
}

document.addEventListener("click", (event) => {
  const sidebar = document.getElementById("sidebar");
  const burger = document.querySelector(".burger");

  if (!sidebar || !burger) return;

  const clickedInsideSidebar = sidebar.contains(event.target);
  const clickedBurger = burger.contains(event.target);

  if (!clickedInsideSidebar && !clickedBurger) {
    sidebar.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const sidebar = document.getElementById("sidebar");
  const burger = document.querySelector(".burger");

  if (!sidebar) return;

  sidebar.classList.remove("open");

  if (burger) {
    burger.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (!initializeApp()) return;

  loadProfileData();

  const sidebar = document.getElementById("sidebar");
  const burger = document.querySelector(".burger");

  if (burger) {
    const isOpen = sidebar && sidebar.classList.contains("open");
    burger.setAttribute("aria-expanded", String(Boolean(isOpen)));
  }

  if (sidebar) {
    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");

        if (burger) {
          burger.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  displayCurrentSession();
  updateWeekFilter();
  displayWorkoutLog();
  updateStats();
  updateProgressPage();
  displayProfileSummary();
  displayBaselineForm();
  displayBaselineSummary();
  applyBaselineDefaults();
  displayRoutineDetails();
  displayDayWorkout();
  displayWeeklyDashboard();
  updateHomeStats();
  displayAchievementsPage();
});

function getCurrentPage() {
  const path = window.location.pathname.split("/").pop();
  return path || "index.html";
}

function generateProfileId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getProfilesStore() {
  const rawProfiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY)) || {};
  const normalizedProfiles = {};
  let changed = false;

  Object.entries(rawProfiles).forEach(([key, profile]) => {
    if (!profile) return;

    const profileId = profile.id || key;
    normalizedProfiles[profileId] = {
      ...profile,
      id: profileId
    };

    if (profile.id !== profileId || key !== profileId) {
      changed = true;
    }
  });

  if (changed) {
    saveProfilesStore(normalizedProfiles);
  }

  return normalizedProfiles;
}

function saveProfilesStore(profiles) {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

function getActiveProfileKey() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
}

function setActiveProfileKey(profileKey) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileKey);
}

function clearActiveProfileKey() {
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

function getStoredProfile() {
  const profiles = getProfilesStore();
  const activeProfileKey = getActiveProfileKey();

  if (activeProfileKey && profiles[activeProfileKey]) {
    return profiles[activeProfileKey];
  }

  const legacyProfile = JSON.parse(localStorage.getItem("userProfile")) || null;
  if (!legacyProfile) return null;

  const legacyProfileId = generateProfileId();
  profiles[legacyProfileId] = {
    ...legacyProfile,
    id: legacyProfileId
  };
  saveProfilesStore(profiles);
  setActiveProfileKey(legacyProfileId);
  localStorage.removeItem("userProfile");
  return profiles[legacyProfileId];
}

function saveStoredProfile(profile) {
  const profiles = getProfilesStore();
  const existingProfileKey = getActiveProfileKey();
  const profileKey = existingProfileKey || profile.id || generateProfileId();
  profiles[profileKey] = {
    ...profile,
    id: profileKey
  };
  saveProfilesStore(profiles);
  setActiveProfileKey(profileKey);
}

function findProfileByCredentials(name, pin) {
  const profiles = getProfilesStore();

  return Object.values(profiles).find(
    (profile) => profile.name === name && profile.pin === pin
  ) || null;
}

function getProfileStorageKey(key) {
  const activeProfileKey = getActiveProfileKey();
  return activeProfileKey ? `${activeProfileKey}:${key}` : key;
}

function getProfileScopedItem(key, fallbackValue) {
  const scopedKey = getProfileStorageKey(key);
  const scopedValue = localStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return JSON.parse(scopedValue);
  }

  const legacyValue = localStorage.getItem(key);
  if (legacyValue === null) {
    return fallbackValue;
  }

  localStorage.setItem(scopedKey, legacyValue);
  return JSON.parse(legacyValue);
}

function setProfileScopedItem(key, value) {
  localStorage.setItem(getProfileStorageKey(key), JSON.stringify(value));
}

function loadProfileData() {
  workouts = getProfileScopedItem("workouts", []);
  currentSession = getProfileScopedItem("currentSession", []);
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function hasCompletedBaseline() {
  const profile = getStoredProfile();
  return Boolean(profile && profile.baseline);
}

function getBaseline() {
  const profile = getStoredProfile();
  return profile && profile.baseline ? profile.baseline : null;
}

function initializeApp() {
  const currentPage = getCurrentPage();

  if (!isLoggedIn() && !PUBLIC_PAGES.includes(currentPage)) {
    window.location.replace("login.html");
    return false;
  }

  if (isLoggedIn() && currentPage === "login.html") {
    redirectAfterLogin();
    return false;
  }

  if (
    isLoggedIn() &&
    !hasCompletedBaseline() &&
    currentPage !== "baseline.html"
  ) {
    window.location.replace("baseline.html");
    return false;
  }

  return true;
}

function redirectAfterLogin() {
  if (hasCompletedBaseline()) {
    window.location.replace("index.html");
    return;
  }

  window.location.replace("baseline.html");
}

function saveData() {
  setProfileScopedItem("workouts", workouts);
  setProfileScopedItem("currentSession", currentSession);
}

function loginOrRegister() {
  const nameInput = document.getElementById("loginName");
  const pinInput = document.getElementById("loginPin");

  if (!nameInput || !pinInput) return;

  const name = nameInput.value.trim();
  const pin = pinInput.value.trim();
  const pinRegex = /^\d{4}$/;
  const profiles = getProfilesStore();
  const existingProfile = findProfileByCredentials(name, pin);
  const sameNameProfile = Object.values(profiles).find((profile) => profile.name === name) || null;

  if (!name || !pin) {
    alert("Please enter your name and 4-digit PIN.");
    return;
  }

  if (!pinRegex.test(pin)) {
    alert("Your password must be exactly 4 numbers.");
    return;
  }

  if (!existingProfile) {
    if (sameNameProfile) {
      alert("That name already exists on this device. Please use the matching PIN.");
      return;
    }

    saveStoredProfile({
      name,
      pin
    });
    localStorage.setItem("isLoggedIn", "true");
    loadProfileData();
    redirectAfterLogin();
    return;
  }

  setActiveProfileKey(existingProfile.id);
  localStorage.setItem("isLoggedIn", "true");
  loadProfileData();
  redirectAfterLogin();
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  clearActiveProfileKey();
  window.location.replace("login.html");
}

function saveBaseline() {
  const form = document.getElementById("baselineForm");
  if (!form) return;

  const pushups = Number(document.getElementById("baselinePushups").value);
  const pullups = Number(document.getElementById("baselinePullups").value);
  const dips = Number(document.getElementById("baselineDips").value);
  const squats = Number(document.getElementById("baselineSquats").value);
  const plank = Number(document.getElementById("baselinePlank").value);
  const daysPerWeek = Number(document.getElementById("baselineDays").value);

  if (
    [pushups, pullups, dips, squats, plank, daysPerWeek].some((value) => Number.isNaN(value))
  ) {
    alert("Please fill in every starting-point field.");
    return;
  }

  const profile = getStoredProfile();
  if (!profile) {
    window.location.replace("login.html");
    return;
  }

  profile.baseline = {
    pushups,
    pullups,
    dips,
    squats,
    plank,
    daysPerWeek
  };

  saveStoredProfile(profile);
  window.location.replace("index.html");
}

function displayBaselineForm() {
  const profileName = document.getElementById("baselineProfileName");
  const baselineDays = document.getElementById("baselineDays");
  const profile = getStoredProfile();
  const baseline = getBaseline();

  if (profileName && profile) {
    profileName.textContent = profile.name;
  }

  if (baselineDays && baseline && baseline.daysPerWeek) {
    baselineDays.value = String(baseline.daysPerWeek);
  }

  const baselineFields = [
    ["baselinePushups", "pushups"],
    ["baselinePullups", "pullups"],
    ["baselineDips", "dips"],
    ["baselineSquats", "squats"],
    ["baselinePlank", "plank"]
  ];

  baselineFields.forEach(([fieldId, key]) => {
    const field = document.getElementById(fieldId);
    if (field && baseline && baseline[key] !== undefined) {
      field.value = baseline[key];
    }
  });
}

function displayProfileSummary() {
  const profileSummary = document.getElementById("profileSummary");
  const profile = getStoredProfile();

  if (!profileSummary || !profile) return;

  profileSummary.innerHTML = `
    <div class="profile-card">
      <h2 class="section-title">Welcome back, ${profile.name}</h2>
      <p class="section-copy">
        ${profile.baseline ? "Your plan can build from your real starting point." : "Set your starting point to make your plan smarter."}
      </p>
      <div class="profile-actions">
        <a class="soft-link-button" href="baseline.html">${profile.baseline ? "Edit Starting Point" : "Set Starting Point"}</a>
      </div>
    </div>
  `;
}

function displayBaselineSummary() {
  const baselineSummary = document.getElementById("baselineSummary");
  const baseline = getBaseline();

  if (!baselineSummary || !baseline) return;

  baselineSummary.innerHTML = `
    <div class="goal-card baseline-summary-card">
      <h2 class="section-title">Your Starting Point</h2>
      <div class="baseline-grid">
        <div class="stat-card"><h3>${baseline.pushups}</h3><p>Push-Ups</p></div>
        <div class="stat-card"><h3>${baseline.pullups}</h3><p>Pull-Ups</p></div>
        <div class="stat-card"><h3>${baseline.dips}</h3><p>Dips</p></div>
        <div class="stat-card"><h3>${baseline.squats}</h3><p>Squats</p></div>
        <div class="stat-card"><h3>${baseline.plank}s</h3><p>Plank Hold</p></div>
        <div class="stat-card"><h3>${baseline.daysPerWeek}</h3><p>Days / Week</p></div>
      </div>
    </div>
  `;
}

function getSelectedWorkoutDay() {
  return getProfileScopedItem("selectedWorkoutDay", null);
}

function saveSelectedWorkoutDay(selectedWorkoutDay) {
  setProfileScopedItem("selectedWorkoutDay", selectedWorkoutDay);
}

function getGeneratedPlan() {
  return getProfileScopedItem("generatedPlan", []);
}

function saveGeneratedPlan(plan) {
  setProfileScopedItem("generatedPlan", plan);
}

function getBestRepsForExercise(exerciseName) {
  const matchingWorkouts = workouts.filter(
    (workout) => workout.exercise.toLowerCase() === exerciseName.toLowerCase()
  );

  if (matchingWorkouts.length === 0) return 0;

  return Math.max(...matchingWorkouts.map((workout) => workout.reps));
}

function getActiveWeek() {
  const numericWeeks = workouts
    .map((workout) => Number(workout.week))
    .filter((week) => !Number.isNaN(week));

  return numericWeeks.length > 0 ? Math.max(...numericWeeks) : 1;
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

  if (Number.isNaN(Number(week)) || Number.isNaN(Number(sets)) || Number.isNaN(Number(reps))) {
    alert("Week, sets, and reps must be numbers.");
    return;
  }

  currentSession.push({
    week: Number(week),
    day,
    exercise,
    sets: Number(sets),
    reps: Number(reps),
    notes
  });

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

  currentSession.forEach((workout, index) => {
    const item = document.createElement("div");
    item.className = "session-item";
    item.innerHTML = `
      <button class="delete-btn delete-btn-top" onclick="removeFromSession(${index})" aria-label="Delete workout">&times;</button>
      <div class="entry-card-content">
        <strong>Week ${workout.week}</strong> - ${workout.day}<br>
        ${workout.exercise} | ${workout.sets} sets x ${workout.reps} reps<br>
        ${workout.notes ? `<em>Notes:</em> ${workout.notes}` : ""}
      </div>
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

  const completedAt = new Date().toISOString();

  workouts.push(
    ...currentSession.map((workout) => ({
      ...workout,
      completedAt: workout.completedAt || completedAt
    }))
  );
  currentSession = [];
  saveData();
  displayCurrentSession();
  updateWeekFilter();
  displayWorkoutLog();
  updateStats();
  updateProgressPage();
  updateHomeStats();
  displayWeeklyDashboard();
  displayAchievementsPage();
  alert("Workout session saved to your diary.");
}

function displayWorkoutLog() {
  const workoutList = document.getElementById("workoutList");
  const weekFilter = document.getElementById("weekFilter");

  if (!workoutList) return;

  let filteredWorkouts = workouts;

  if (weekFilter && weekFilter.value !== "all") {
    filteredWorkouts = workouts.filter((workout) => workout.week === Number(weekFilter.value));
  }

  workoutList.innerHTML = "";

  if (filteredWorkouts.length === 0) {
    workoutList.innerHTML = `<p class="empty-message">No workouts found.</p>`;
    return;
  }

  filteredWorkouts.forEach((workout) => {
    const originalIndex = workouts.indexOf(workout);
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <button class="delete-btn delete-btn-top" onclick="deleteWorkout(${originalIndex})" aria-label="Delete workout">&times;</button>
      <div class="entry-card-content">
        <strong>Week ${workout.week}</strong> - ${workout.day}<br>
        ${workout.exercise} | ${workout.sets} sets x ${workout.reps} reps<br>
        ${workout.notes ? `<em>Notes:</em> ${workout.notes}` : ""}
      </div>
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
  updateHomeStats();
  displayWeeklyDashboard();
}

function updateWeekFilter() {
  const weekFilter = document.getElementById("weekFilter");
  if (!weekFilter) return;

  const currentValue = weekFilter.value;
  const uniqueWeeks = [...new Set(workouts.map((workout) => workout.week))].sort((a, b) => a - b);

  weekFilter.innerHTML = `<option value="all">All Weeks</option>`;

  uniqueWeeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = `Week ${week}`;
    weekFilter.appendChild(option);
  });

  if ([...weekFilter.options].some((option) => option.value === currentValue)) {
    weekFilter.value = currentValue;
  }
}

function updateStats() {
  const totalWorkouts = document.getElementById("totalWorkouts");
  const totalSets = document.getElementById("totalSets");
  const totalReps = document.getElementById("totalReps");

  if (totalWorkouts) {
    totalWorkouts.textContent = workouts.length;
  }

  if (totalSets) {
    totalSets.textContent = workouts.reduce((sum, workout) => sum + workout.sets, 0);
  }

  if (totalReps) {
    totalReps.textContent = workouts.reduce((sum, workout) => sum + workout.reps, 0);
  }
}

function getScaledReps(maxValue, multiplier, fallback, minimum = 1) {
  if (!maxValue || maxValue <= 0) return fallback;
  return Math.max(minimum, Math.round(maxValue * multiplier));
}

function getPushupProgression(pushups) {
  if (!pushups || pushups <= 1) {
    return {
      exercise: "Incline Push-Ups",
      reps: 8,
      notes: "Use a bench, box, or wall so every rep stays smooth.",
      why: "Chosen because your current push-up max is very low, so we want a safer way to build pressing strength."
    };
  }

  if (pushups <= 3) {
    return {
      exercise: "Knee Push-Ups",
      reps: 6,
      notes: "Build clean reps first, then move toward full push-ups.",
      why: "Chosen because you are close to full push-ups, but still need a progression that lets you practice clean reps."
    };
  }

  if (pushups <= 7) {
    return {
      exercise: "Push-Ups",
      reps: Math.max(4, Math.round(pushups * 0.7)),
      notes: "Stop before form breaks.",
      why: "Chosen because you already have enough push-up strength to train the standard version with controlled volume."
    };
  }

  return {
    exercise: "Push-Ups",
    reps: Math.max(6, Math.round(pushups * 0.65)),
    notes: "Keep 1-2 reps in reserve.",
    why: "Chosen because your push-up base is strong enough to keep progressing on the full movement."
  };
}

function getPullProgression(pullups) {
  if (!pullups || pullups <= 0) {
    return {
      exercise: "Negative Pull-Ups",
      reps: 4,
      notes: "Jump to the top and lower slowly for 3-5 seconds.",
      why: "Chosen because negatives build pull-up strength even before full reps are available."
    };
  }

  if (pullups <= 2) {
    return {
      exercise: "Banded Pull-Ups",
      reps: 4,
      notes: "Use assistance to hit clean full range reps.",
      why: "Chosen because you can start practicing the full pull-up pattern with assistance."
    };
  }

  if (pullups <= 4) {
    return {
      exercise: "Pull-Ups",
      reps: Math.max(2, pullups),
      notes: "Keep reps crisp and controlled.",
      why: "Chosen because you already have some pull-ups and now need controlled strength work."
    };
  }

  return {
    exercise: "Pull-Ups",
    reps: Math.max(3, Math.round(pullups * 0.65)),
    notes: "",
    why: "Chosen because your pull-up base is strong enough for standard pull-up progression."
  };
}

function getHorizontalPullProgression(pullups) {
  if (!pullups || pullups <= 0) {
    return {
      exercise: "Australian Pull-Ups",
      reps: 8,
      notes: "Use this to build pulling strength toward full pull-ups.",
      why: "Chosen because horizontal pulling is one of the best ways to build your first vertical pull."
    };
  }

  if (pullups <= 3) {
    return {
      exercise: "Feet-Supported Pull-Ups",
      reps: 5,
      notes: "Use your feet lightly to help through the sticking point.",
      why: "Chosen because you are between rows and full pull-ups and need a bridge progression."
    };
  }

  return {
    exercise: "Australian Pull-Ups",
    reps: Math.max(6, Math.round(pullups * 2)),
    notes: "",
    why: "Chosen because extra horizontal pulling volume supports stronger full pull-ups."
  };
}

function getDipProgression(dips) {
  if (!dips || dips <= 1) {
    return {
      exercise: "Bench Dips",
      reps: 6,
      notes: "Use a comfortable range and keep shoulders happy.",
      why: "Chosen because it builds dip strength with a simpler setup and lower load."
    };
  }

  if (dips <= 3) {
    return {
      exercise: "Straight-Bar Support Holds",
      reps: 20,
      notes: "seconds",
      why: "Chosen because support strength and shoulder control come before strong dips."
    };
  }

  if (dips <= 5) {
    return {
      exercise: "Banded Dips",
      reps: Math.max(3, dips),
      notes: "Use assistance until bodyweight reps feel solid.",
      why: "Chosen because assistance lets you practice clean dip mechanics before full bodyweight volume."
    };
  }

  return {
    exercise: "Dips",
    reps: Math.max(4, Math.round(dips * 0.65)),
    notes: "",
    why: "Chosen because your current dip level is strong enough for standard dip progression."
  };
}

function getSquatProgressions(squats) {
  if (!squats || squats <= 8) {
    return {
      main: { exercise: "Bulgarian Split Squats", reps: 8, notes: "each leg", why: "Chosen to build single-leg strength and stability before harder squat variations." },
      skill: { exercise: "Assisted Shrimp Squats", reps: 5, notes: "each leg", why: "Chosen as an easier balance and control progression toward advanced single-leg squats." }
    };
  }

  if (squats <= 18) {
    return {
      main: { exercise: "Bulgarian Split Squats", reps: Math.max(8, Math.round(squats * 0.5)), notes: "each leg", why: "Chosen because you still need more single-leg volume and control." },
      skill: { exercise: "Assisted Pistol Squats", reps: 5, notes: "each leg", why: "Chosen because you are ready to start practicing pistol squat mechanics with support." }
    };
  }

  if (squats <= 30) {
    return {
      main: { exercise: "Bulgarian Split Squats", reps: Math.max(8, Math.round(squats * 0.45)), notes: "each leg", why: "Chosen because single-leg strength still needs solid weekly volume." },
      skill: { exercise: "Box Pistol Squats", reps: 5, notes: "each leg", why: "Chosen because lowering to a box helps you train pistol squat depth with control." }
    };
  }

  return {
    main: { exercise: "Pistol Squat Progressions", reps: 6, notes: "each leg", why: "Chosen because your squat base is now strong enough for advanced single-leg work." },
    skill: { exercise: "Bulgarian Split Squats", reps: Math.max(10, Math.round(squats * 0.35)), notes: "each leg", why: "Chosen to keep building leg strength alongside skill work." }
  };
}

function getHandstandProgression(pushups) {
  if (!pushups || pushups <= 3) {
    return {
      exercise: "Wall Plank Shoulder Taps",
      reps: 8,
      notes: "total taps",
      why: "Chosen because shoulder strength and balance need to come first before handstand holds."
    };
  }

  if (pushups <= 8) {
    return {
      exercise: "Wall Walks",
      reps: 4,
      notes: "controlled reps",
      why: "Chosen because you are ready for a stronger inverted progression without full handstand holds yet."
    };
  }

  return {
    exercise: "Wall Handstand Holds",
    reps: 20,
    notes: "seconds",
    why: "Chosen because your pushing strength is high enough to spend time upside down with control."
  };
}

function getStrengthPlan(levelValue, baseline) {
  const pushupProgression = getPushupProgression(baseline?.pushups);
  const pullProgression = getPullProgression(baseline?.pullups);
  const horizontalPullProgression = getHorizontalPullProgression(baseline?.pullups);
  const dipProgression = getDipProgression(baseline?.dips);
  const squatProgressions = getSquatProgressions(baseline?.squats);
  const plankSeconds = getScaledReps(baseline?.plank, 0.7, levelValue === "beginner" ? 25 : 40, 10);

  return [
    {
      day: "Day 1",
      exercises: [
        { exercise: pushupProgression.exercise, sets: 3, reps: pushupProgression.reps, notes: pushupProgression.notes, why: pushupProgression.why },
        { exercise: horizontalPullProgression.exercise, sets: 3, reps: horizontalPullProgression.reps, notes: horizontalPullProgression.notes, why: horizontalPullProgression.why },
        { exercise: squatProgressions.main.exercise, sets: 3, reps: squatProgressions.main.reps, notes: squatProgressions.main.notes, why: squatProgressions.main.why },
        { exercise: "Plank", sets: 3, reps: plankSeconds, notes: "seconds" }
      ]
    },
    {
      day: "Day 2",
      exercises: [
        { exercise: "Pike Push-Ups", sets: 3, reps: Math.max(4, Math.round(pushupProgression.reps * 0.7)), notes: "" },
        { exercise: dipProgression.exercise, sets: 3, reps: dipProgression.reps, notes: dipProgression.notes, why: dipProgression.why },
        { exercise: squatProgressions.skill.exercise, sets: 3, reps: squatProgressions.skill.reps, notes: squatProgressions.skill.notes, why: squatProgressions.skill.why },
        { exercise: "Hollow Hold", sets: 3, reps: Math.max(15, Math.round(plankSeconds * 0.7)), notes: "seconds" }
      ]
    },
    {
      day: "Day 3",
      exercises: [
        { exercise: pushupProgression.exercise, sets: 3, reps: Math.max(pushupProgression.reps + 1, Math.round(pushupProgression.reps * 1.1)), notes: pushupProgression.notes, why: pushupProgression.why },
        { exercise: pullProgression.exercise, sets: 3, reps: Math.max(pullProgression.reps, Math.round(pullProgression.reps * 1.1)), notes: pullProgression.notes, why: pullProgression.why },
        { exercise: "Bulgarian Split Squats", sets: 3, reps: Math.max(8, squatProgressions.main.reps), notes: "each leg", why: "Chosen to keep building strong single-leg capacity alongside your main progression." },
        { exercise: "Plank", sets: 3, reps: Math.max(plankSeconds + 5, Math.round(plankSeconds * 1.15)), notes: "seconds" }
      ]
    },
    {
      day: "Day 4",
      exercises: [
        { exercise: "Mobility Flow", sets: 1, reps: 15, notes: "minutes" },
        { exercise: "Core Work", sets: 3, reps: Math.max(10, Math.round(plankSeconds * 0.4)), notes: "" }
      ]
    }
  ];
}

function getSkillsPlan(levelValue, baseline) {
  const pushupProgression = getPushupProgression(baseline?.pushups);
  const pullProgression = getPullProgression(baseline?.pullups);
  const horizontalPullProgression = getHorizontalPullProgression(baseline?.pullups);
  const squatProgressions = getSquatProgressions(baseline?.squats);
  const handstandProgression = getHandstandProgression(baseline?.pushups);
  const plankSeconds = getScaledReps(baseline?.plank, 0.65, levelValue === "beginner" ? 20 : 30, 10);

  return [
    {
      day: "Day 1",
      exercises: [
        { exercise: horizontalPullProgression.exercise, sets: 3, reps: horizontalPullProgression.reps, notes: horizontalPullProgression.notes, why: horizontalPullProgression.why },
        { exercise: "Knee Raises", sets: 3, reps: Math.max(8, Math.round(plankSeconds * 0.4)), notes: "" },
        { exercise: "Plank", sets: 3, reps: plankSeconds, notes: "seconds" }
      ]
    },
    {
      day: "Day 2",
      exercises: [
        { exercise: "Pike Push-Ups", sets: 3, reps: Math.max(4, Math.round(pushupProgression.reps * 0.8)), notes: "" },
        { exercise: handstandProgression.exercise, sets: 3, reps: handstandProgression.reps, notes: handstandProgression.notes, why: handstandProgression.why },
        { exercise: squatProgressions.skill.exercise, sets: 3, reps: Math.max(4, squatProgressions.skill.reps), notes: squatProgressions.skill.notes, why: squatProgressions.skill.why }
      ]
    },
    {
      day: "Day 3",
      exercises: [
        { exercise: pullProgression.exercise, sets: 3, reps: Math.max(2, pullProgression.reps), notes: pullProgression.notes, why: pullProgression.why },
        { exercise: pushupProgression.exercise, sets: 3, reps: pushupProgression.reps, notes: pushupProgression.notes, why: pushupProgression.why },
        { exercise: "L-Sit Tuck Hold", sets: 3, reps: Math.max(8, Math.round(plankSeconds * 0.5)), notes: "seconds" }
      ]
    },
    {
      day: "Day 4",
      exercises: [
        { exercise: "Mobility", sets: 1, reps: 15, notes: "minutes" },
        { exercise: squatProgressions.main.exercise, sets: 3, reps: squatProgressions.main.reps, notes: squatProgressions.main.notes, why: squatProgressions.main.why }
      ]
    }
  ];
}

function getEndurancePlan(levelValue, baseline) {
  const pushupProgression = getPushupProgression(baseline?.pushups);
  const horizontalPullProgression = getHorizontalPullProgression(baseline?.pullups);
  const dipProgression = getDipProgression(baseline?.dips);
  const squatProgressions = getSquatProgressions(baseline?.squats);
  const plankSeconds = getScaledReps(baseline?.plank, 0.8, levelValue === "beginner" ? 20 : 35, 10);

  return [
    {
      day: "Day 1",
      exercises: [
        {
          exercise: pushupProgression.exercise,
          sets: 4,
          reps: Math.max(pushupProgression.reps, Math.round(pushupProgression.reps * 1.2)),
          notes: pushupProgression.notes,
          why: "Chosen to build more work capacity on a version you can repeat with good form."
        },
        {
          exercise: horizontalPullProgression.exercise,
          sets: 4,
          reps: Math.max(horizontalPullProgression.reps, Math.round(horizontalPullProgression.reps * 1.15)),
          notes: horizontalPullProgression.notes,
          why: "Chosen to increase pulling volume without pushing you into sloppy reps."
        },
        {
          exercise: squatProgressions.main.exercise,
          sets: 4,
          reps: Math.max(squatProgressions.main.reps, Math.round(squatProgressions.main.reps * 1.2)),
          notes: squatProgressions.main.notes,
          why: "Chosen to improve leg endurance through repeatable, controlled single-leg work."
        },
        { exercise: "Plank", sets: 3, reps: plankSeconds, notes: "seconds" }
      ]
    },
    {
      day: "Day 2",
      exercises: [
        {
          exercise: "Incline Push-Ups",
          sets: 3,
          reps: Math.max(8, pushupProgression.reps),
          notes: "Move smoothly and keep rest short.",
          why: "Chosen as a lighter pressing day so you can build volume without burning out."
        },
        {
          exercise: dipProgression.exercise,
          sets: 3,
          reps: Math.max(dipProgression.reps, 6),
          notes: dipProgression.notes,
          why: "Chosen to add upper-body volume with a progression that still feels repeatable."
        },
        {
          exercise: "Bulgarian Split Squats",
          sets: 3,
          reps: Math.max(10, squatProgressions.main.reps),
          notes: "each leg",
          why: "Chosen to build stronger legs and better endurance one side at a time."
        },
        {
          exercise: "Hollow Hold",
          sets: 3,
          reps: Math.max(15, Math.round(plankSeconds * 0.75)),
          notes: "seconds"
        }
      ]
    },
    {
      day: "Day 3",
      exercises: [
        {
          exercise: horizontalPullProgression.exercise,
          sets: 4,
          reps: Math.max(horizontalPullProgression.reps, Math.round(horizontalPullProgression.reps * 1.2)),
          notes: horizontalPullProgression.notes,
          why: "Chosen to accumulate more quality pulling reps and improve endurance."
        },
        {
          exercise: pushupProgression.exercise,
          sets: 4,
          reps: Math.max(pushupProgression.reps, Math.round(pushupProgression.reps * 1.15)),
          notes: pushupProgression.notes,
          why: "Chosen to improve repeat strength on your current pushing variation."
        },
        {
          exercise: squatProgressions.skill.exercise,
          sets: 3,
          reps: Math.max(6, squatProgressions.skill.reps),
          notes: squatProgressions.skill.notes,
          why: "Chosen to keep single-leg skill work progressing while you build endurance."
        },
        { exercise: "Plank", sets: 3, reps: Math.max(plankSeconds + 5, 25), notes: "seconds" }
      ]
    },
    {
      day: "Day 4",
      exercises: [
        { exercise: "Mobility Flow", sets: 1, reps: 15, notes: "minutes" },
        { exercise: "Balance Practice", sets: 3, reps: 6, notes: "" }
      ]
    }
  ];
}

function applyBaselineDefaults() {
  const daysPerWeek = document.getElementById("daysPerWeek");
  const baseline = getBaseline();

  if (daysPerWeek && baseline && baseline.daysPerWeek) {
    daysPerWeek.value = String(baseline.daysPerWeek);
  }
}

function generatePlan() {
  const goal = document.getElementById("goal");
  const level = document.getElementById("level");
  const daysPerWeek = document.getElementById("daysPerWeek");
  const baseline = getBaseline();

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
    plan = getStrengthPlan(levelValue, baseline);
  } else if (goalValue === "skills" && levelValue === "beginner") {
    plan = getSkillsPlan(levelValue, baseline);
  } else if (goalValue === "endurance") {
    plan = getEndurancePlan(levelValue, baseline);
  } else {
    plan = getStrengthPlan(levelValue, baseline);
  }

  saveGeneratedPlan(plan.slice(0, daysValue));
  window.location.href = "routine-details.html";
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
    pullupMessage.textContent = "Your first pull-up is loading, and every step is getting you closer.";
    pullupProgressText.textContent = "Your glow-up has officially started.";
  } else if (bestPullups >= 1) {
    pullupMessage.textContent = "You did your first pull-up. This is your main character moment.";
    pullupProgressText.textContent = "100% complete, and this is just the beginning.";
  } else {
    pullupMessage.textContent = "You are getting closer to your first pull-up. Keep showing up.";
    pullupProgressText.textContent = `${Math.round(progressPercent)}% of your first pull-up goal`;
  }

  pullupProgressFill.style.width = `${progressPercent}%`;
}

function displayRoutineDetails() {
  const container = document.getElementById("routineDetails");
  if (!container) return;

  const plan = getGeneratedPlan();
  container.innerHTML = "";

  if (plan.length === 0) {
    container.innerHTML = `<p class="empty-message">No routine generated yet.</p>`;
    return;
  }

  plan.forEach((dayPlan, dayIndex) => {
    const dayCard = document.createElement("div");
    dayCard.className = "goal-card routine-day-card";

    let exercisesHtml = `
      <h2 class="section-title">${dayPlan.day}</h2>
      <p class="section-copy">Edit this day or start it when you are ready.</p>
      <div class="routine-exercises">
    `;

    exercisesHtml += dayPlan.exercises.map((exercise, exerciseIndex) => `
      <div class="log-item routine-exercise-form">
        <div class="routine-input-stack">
          <input type="text" value="${exercise.exercise}" id="exercise-${dayIndex}-${exerciseIndex}" placeholder="Exercise name">
          <input type="number" value="${exercise.sets}" id="sets-${dayIndex}-${exerciseIndex}" placeholder="Sets">
          <input type="number" value="${exercise.reps}" id="reps-${dayIndex}-${exerciseIndex}" placeholder="Target reps">
          <input type="text" value="${exercise.notes}" id="notes-${dayIndex}-${exerciseIndex}" placeholder="Notes / easier version / injury note">
          ${exercise.why ? `<p class="why-note">${exercise.why}</p>` : ""}
        </div>
      </div>
    `).join("");

    exercisesHtml += `
      </div>
      <div class="exercise-actions routine-start-row">
        <button onclick="openDayWorkout(${dayIndex})">Start ${dayPlan.day}</button>
      </div>
    `;

    dayCard.innerHTML = exercisesHtml;
    container.appendChild(dayCard);
  });
}

function saveEditedRoutine() {
  const plan = getGeneratedPlan();

  plan.forEach((dayPlan, dayIndex) => {
    dayPlan.exercises.forEach((exercise, exerciseIndex) => {
      exercise.exercise = document.getElementById(`exercise-${dayIndex}-${exerciseIndex}`).value.trim();
      exercise.sets = Number(document.getElementById(`sets-${dayIndex}-${exerciseIndex}`).value);
      exercise.reps = Number(document.getElementById(`reps-${dayIndex}-${exerciseIndex}`).value);
      exercise.notes = document.getElementById(`notes-${dayIndex}-${exerciseIndex}`).value.trim();
    });
  });

  saveGeneratedPlan(plan);
  alert("Your routine was updated.");
}

function openDayWorkout(dayIndex) {
  const plan = getGeneratedPlan();
  const existingSelectedDay = getSelectedWorkoutDay();

  if (!plan[dayIndex]) {
    alert("Day not found.");
    return;
  }

  const existingCompletedExercises =
    existingSelectedDay &&
    existingSelectedDay.dayIndex === dayIndex &&
    Array.isArray(existingSelectedDay.completedExercises)
      ? existingSelectedDay.completedExercises
      : [];

  saveSelectedWorkoutDay({
    dayIndex,
    dayData: plan[dayIndex],
    completedExercises: existingCompletedExercises
  });

  window.location.href = "day-workout.html";
}

function startRoutineAsSession() {
  const plan = getGeneratedPlan();

  if (plan.length === 0) {
    alert("Generate your routine first.");
    return;
  }

  openDayWorkout(0);
}

function displayDayWorkout() {
  const container = document.getElementById("dayWorkoutContainer");
  if (!container) return;

  const selected = getSelectedWorkoutDay();

  if (!selected || !selected.dayData) {
    container.innerHTML = `<p class="empty-message">No workout day selected yet.</p>`;
    return;
  }

  const dayData = selected.dayData;
  const completedExercises = Array.isArray(selected.completedExercises) ? selected.completedExercises : [];
  const completedCount = completedExercises.filter(Boolean).length;
  const headerStatusClass =
    completedCount === dayData.exercises.length
      ? "status-done"
      : completedCount > 0
        ? "status-in-progress"
        : "status-not-started";
  const headerStatusText =
    completedCount === dayData.exercises.length
      ? "Done"
      : completedCount > 0
        ? `${completedCount}/${dayData.exercises.length} done`
        : "Not Started";

  container.innerHTML = `
    <div class="goal-card workout-day-header">
      <h2 class="section-title">${dayData.day}</h2>
      <p class="section-copy">Complete each exercise one by one and log what you actually managed today.</p>
      <div class="day-status-row">
        <span class="day-status ${headerStatusClass}">${headerStatusText}</span>
      </div>
    </div>
  `;

  dayData.exercises.forEach((exercise, exerciseIndex) => {
    const exerciseCard = document.createElement("div");
    const isCompleted = Boolean(completedExercises[exerciseIndex]);
    exerciseCard.className = `goal-card workout-exercise-card${isCompleted ? " completed-card" : ""}`;
    exerciseCard.id = `exercise-card-${exerciseIndex}`;

    let setInputs = "";
    for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
      setInputs += `
        <label class="set-input-group">
          <span>Set ${setIndex + 1} actual reps</span>
          <input type="number" id="actual-${exerciseIndex}-${setIndex}" placeholder="Enter reps completed">
        </label>
      `;
    }

    exerciseCard.innerHTML = `
      <div class="exercise-card-head">
        <div>
          <h2 class="section-title">${exercise.exercise}</h2>
          <p class="exercise-target"><strong>Target:</strong> ${exercise.sets} sets x ${exercise.reps} reps</p>
        </div>
        <span class="day-status ${isCompleted ? "status-done" : "status-not-started"}">${isCompleted ? "Completed" : "To Do"}</span>
      </div>
      ${exercise.notes ? `<p class="exercise-notes"><strong>Notes:</strong> ${exercise.notes}</p>` : ""}
      ${exercise.why ? `<p class="why-note"><strong>Why this variation:</strong> ${exercise.why}</p>` : ""}
      <div class="set-inputs-grid">
        ${setInputs}
      </div>
      <label class="set-input-group extra-notes-field">
        <span>Extra notes</span>
        <input type="text" id="extra-notes-${exerciseIndex}" placeholder="How did it feel? Injury? Easier version?">
      </label>
      <div class="exercise-actions">
        <button id="done-btn-${exerciseIndex}" class="${isCompleted ? "done-state" : ""}" onclick="markExerciseDone(${exerciseIndex})" ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "Done &#10003;" : "Done"}
        </button>
      </div>
    `;

    container.appendChild(exerciseCard);
  });
}

function markExerciseDone(exerciseIndex) {
  const selected = getSelectedWorkoutDay();

  if (!selected || !selected.dayData) {
    alert("No workout day selected.");
    return;
  }

  const dayData = selected.dayData;
  const exercise = dayData.exercises[exerciseIndex];
  const completedExercises = Array.isArray(selected.completedExercises) ? selected.completedExercises : [];

  if (!exercise) {
    alert("Exercise not found.");
    return;
  }

  if (completedExercises[exerciseIndex]) {
    return;
  }

  const actualReps = [];

  for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
    const input = document.getElementById(`actual-${exerciseIndex}-${setIndex}`);
    const value = input ? input.value.trim() : "";
    actualReps.push(value === "" ? 0 : Number(value));
  }

  const extraNotesInput = document.getElementById(`extra-notes-${exerciseIndex}`);
  const extraNotes = extraNotesInput ? extraNotesInput.value.trim() : "";
  const totalActualReps = actualReps.reduce((sum, reps) => sum + reps, 0);

  workouts.push({
    week: getActiveWeek(),
    day: dayData.day,
    exercise: exercise.exercise,
    sets: exercise.sets,
    reps: totalActualReps,
    notes: `Target: ${exercise.sets} x ${exercise.reps}. Actual sets: ${actualReps.join(", ")}${extraNotes ? ` | ${extraNotes}` : ""}`,
    completedAt: new Date().toISOString()
  });

  saveData();

  completedExercises[exerciseIndex] = true;
  saveSelectedWorkoutDay({
    ...selected,
    completedExercises
  });

  updateWeekFilter();
  updateStats();
  updateProgressPage();
  updateHomeStats();
  displayWeeklyDashboard();
  displayAchievementsPage();
  displayDayWorkout();

  alert(`${exercise.exercise} saved to your progress diary.`);
}

function displayWeeklyDashboard() {
  const weekDaysGrid = document.getElementById("weekDaysGrid");
  const currentWeekTitle = document.getElementById("currentWeekTitle");

  if (!weekDaysGrid || !currentWeekTitle) return;

  const plan = getGeneratedPlan();
  const currentWeek = getActiveWeek();

  currentWeekTitle.textContent = `Week ${currentWeek}`;
  weekDaysGrid.innerHTML = "";

  if (plan.length === 0) {
    weekDaysGrid.innerHTML = `
      <div class="goal-card">
        <p class="empty-message">No routine yet. Go to <strong>My Routine</strong> and generate your week first.</p>
      </div>
    `;
    return;
  }

  plan.forEach((dayPlan, dayIndex) => {
    const completedExerciseCount = dayPlan.exercises.filter((exercise) =>
      workouts.some((workout) => workout.day === dayPlan.day && workout.exercise === exercise.exercise)
    ).length;
    const isComplete = completedExerciseCount === dayPlan.exercises.length;
    const isInProgress = completedExerciseCount > 0 && !isComplete;
    const dayStatusText = isComplete
      ? "Done"
      : isInProgress
        ? `${completedExerciseCount}/${dayPlan.exercises.length} done`
        : "Not Started";

    const card = document.createElement("div");
    card.className = "day-card";

    card.innerHTML = `
      <h3>${dayPlan.day}</h3>
      <span class="day-status ${isComplete ? "status-done" : isInProgress ? "status-in-progress" : "status-not-started"}">
        ${dayStatusText}
      </span>
      <p>${dayPlan.exercises.length} exercises planned</p>
      <button onclick="openDayWorkout(${dayIndex})">
        ${isComplete ? "Open Again" : isInProgress ? "Continue Workout" : "Start Workout"}
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

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWorkoutDateKey(workout) {
  if (!workout || !workout.completedAt) return "";

  const completedDate = new Date(workout.completedAt);
  if (Number.isNaN(completedDate.getTime())) return "";

  return formatLocalDateKey(completedDate);
}

function getUniqueWorkoutDateKeys() {
  return [...new Set(workouts.map(getWorkoutDateKey).filter(Boolean))].sort();
}

function getCurrentStreakDays() {
  const dateKeys = getUniqueWorkoutDateKeys();
  if (dateKeys.length === 0) return 0;

  const dateSet = new Set(dateKeys);
  const latestDate = new Date(`${dateKeys[dateKeys.length - 1]}T00:00:00`);
  const today = new Date();
  const todayKey = formatLocalDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatLocalDateKey(yesterday);

  const latestKey = dateKeys[dateKeys.length - 1];
  if (latestKey !== todayKey && latestKey !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(latestDate);

  while (dateSet.has(formatLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLongestStreakDays() {
  const dateKeys = getUniqueWorkoutDateKeys();
  if (dateKeys.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < dateKeys.length; index++) {
    const previous = new Date(`${dateKeys[index - 1]}T00:00:00`);
    const currentDate = new Date(`${dateKeys[index]}T00:00:00`);
    const diffDays = Math.round((currentDate - previous) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function getWorkoutsCompletedThisWeek() {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOffset = (now.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - dayOffset);

  return workouts.filter((workout) => {
    if (!workout.completedAt) return false;
    const completedDate = new Date(workout.completedAt);
    return !Number.isNaN(completedDate.getTime()) && completedDate >= startOfWeek;
  }).length;
}

function getLatestWorkout() {
  const datedWorkouts = workouts
    .filter((workout) => getWorkoutDateKey(workout))
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));

  return datedWorkouts[0] || null;
}

function getAchievementHighlight() {
  const latestWorkout = getLatestWorkout();
  const currentStreak = getCurrentStreakDays();
  const bestPushups = getBestRepsForExercise("Push-Ups");
  const bestPullups = getBestRepsForExercise("Pull-Ups");

  if (currentStreak >= 5) {
    return `You are on a ${currentStreak}-day streak. That is serious consistency.`;
  }

  if (bestPullups >= 1) {
    return `You unlocked ${bestPullups} pull-up${bestPullups === 1 ? "" : "s"} and your upper-body glow-up is real.`;
  }

  if (bestPushups >= 10) {
    return `You hit ${bestPushups} push-ups and your strength base is climbing.`;
  }

  if (latestWorkout) {
    return `Latest win: ${latestWorkout.exercise} on ${latestWorkout.day}. Showing up still counts.`;
  }

  return "Your first logged workout is going to unlock this little achievement wall.";
}

function getAchievementMilestones() {
  const currentStreak = getCurrentStreakDays();
  const longestStreak = getLongestStreakDays();
  const thisWeek = getWorkoutsCompletedThisWeek();
  const bestPushups = getBestRepsForExercise("Push-Ups");
  const bestPullups = getBestRepsForExercise("Pull-Ups");
  const bestDips = getBestRepsForExercise("Dips");

  return [
    {
      label: "Current Streak",
      value: currentStreak ? `${currentStreak} day${currentStreak === 1 ? "" : "s"}` : "Start today",
      note: currentStreak ? "Keep the chain alive." : "Log a workout to begin."
    },
    {
      label: "Longest Streak",
      value: `${longestStreak} day${longestStreak === 1 ? "" : "s"}`,
      note: "Your best consistency run so far."
    },
    {
      label: "This Week",
      value: `${thisWeek} workout${thisWeek === 1 ? "" : "s"}`,
      note: "Every session this week counts."
    },
    {
      label: "Best Push-Ups",
      value: `${bestPushups}`,
      note: "Highest push-up total logged."
    },
    {
      label: "Best Pull-Ups",
      value: `${bestPullups}`,
      note: "Progress toward stronger pulling."
    },
    {
      label: "Best Dips",
      value: `${bestDips}`,
      note: "Your dip PR from the diary."
    }
  ];
}

function copyAchievementCaption() {
  const profile = getStoredProfile();
  const profileName = profile ? profile.name : "My";
  const currentStreak = getCurrentStreakDays();
  const totalWorkouts = workouts.length;
  const highlight = getAchievementHighlight();
  const caption = `${profileName}'s calisthenics check-in\n${currentStreak} day streak\n${totalWorkouts} workouts logged\n${highlight}`;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(caption)
      .then(() => {
        alert("Your story-style caption was copied.");
      })
      .catch(() => {
        alert(caption);
      });
    return;
  }

  alert(caption);
}

function displayAchievementsPage() {
  const streakCount = document.getElementById("streakCount");
  const longestStreak = document.getElementById("longestStreak");
  const thisWeekCount = document.getElementById("thisWeekCount");
  const achievementMessage = document.getElementById("achievementMessage");
  const achievementList = document.getElementById("achievementList");
  const storyCardName = document.getElementById("storyCardName");
  const storyCardStreak = document.getElementById("storyCardStreak");
  const storyCardWorkouts = document.getElementById("storyCardWorkouts");
  const storyCardHighlight = document.getElementById("storyCardHighlight");
  const storyCardDate = document.getElementById("storyCardDate");

  if (
    !streakCount ||
    !longestStreak ||
    !thisWeekCount ||
    !achievementMessage ||
    !achievementList ||
    !storyCardName ||
    !storyCardStreak ||
    !storyCardWorkouts ||
    !storyCardHighlight ||
    !storyCardDate
  ) {
    return;
  }

  const profile = getStoredProfile();
  const currentStreak = getCurrentStreakDays();
  const longest = getLongestStreakDays();
  const thisWeek = getWorkoutsCompletedThisWeek();
  const highlight = getAchievementHighlight();
  const milestones = getAchievementMilestones();
  const shareDate = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  streakCount.textContent = currentStreak;
  longestStreak.textContent = longest;
  thisWeekCount.textContent = thisWeek;
  achievementMessage.textContent = highlight;
  storyCardName.textContent = profile ? `${profile.name}'s Glow-Up` : "My Glow-Up";
  storyCardStreak.textContent = currentStreak
    ? `${currentStreak} day streak`
    : "Ready for day 1";
  storyCardWorkouts.textContent = `${workouts.length} workouts logged`;
  storyCardHighlight.textContent = highlight;
  storyCardDate.textContent = shareDate;

  achievementList.innerHTML = "";

  milestones.forEach((milestone) => {
    const card = document.createElement("div");
    card.className = "achievement-pill";
    card.innerHTML = `
      <strong>${milestone.label}</strong>
      <span>${milestone.value}</span>
      <p>${milestone.note}</p>
    `;
    achievementList.appendChild(card);
  });
}
