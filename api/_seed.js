// Shared seed data — imported by exercises and pods handlers
// Underscore prefix: Vercel does not expose this as a function endpoint

function randomId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

const EXERCISES = [
  { name: 'Burpees', description: 'Full body explosive movement combining a squat, push-up, and jump.', duration_estimate_seconds: 60, difficulty: 'advanced', muscle_groups: ['full body', 'cardio'], equipment: ['bodyweight'], movement_type: 'strength', instructions: ['Stand with feet shoulder-width apart', 'Drop into a squat and place hands on floor', 'Jump feet back to plank', 'Do a push-up', 'Jump feet to hands', 'Explode up with a jump'] },
  { name: 'Jump Squats', description: 'Explosive squat that builds leg power and elevates heart rate.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['legs', 'glutes', 'cardio'], equipment: ['bodyweight'], movement_type: 'strength', instructions: ['Stand feet shoulder-width apart', 'Squat down to 90°', 'Explode upward into a jump', 'Land softly and immediately squat again'] },
  { name: 'Push-up to Downward Dog', description: 'Combines a push-up with a downward dog stretch for chest, shoulders, and hamstrings.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['chest', 'shoulders', 'hamstrings'], equipment: ['bodyweight'], movement_type: 'both', instructions: ['Start in plank position', 'Perform a push-up', 'Push hips up and back into downward dog', 'Hold 2 seconds', 'Return to plank'] },
  { name: 'Mountain Climbers', description: 'Dynamic core exercise that also elevates heart rate.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['core', 'cardio'], equipment: ['bodyweight'], movement_type: 'strength', instructions: ['Start in high plank', 'Drive right knee to chest', 'Switch legs rapidly', 'Maintain flat back throughout'] },
  { name: 'Inchworm Walk-out', description: 'Hamstring stretch and shoulder warm-up in one movement.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['hamstrings', 'core', 'shoulders'], equipment: ['bodyweight'], movement_type: 'both', instructions: ['Stand tall', 'Hinge at hips and touch floor', 'Walk hands out to plank', 'Walk hands back to feet', 'Stand up'] },
  { name: 'Plank Shoulder Taps', description: 'Anti-rotation core exercise in plank position.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['core', 'shoulders'], equipment: ['bodyweight'], movement_type: 'strength', instructions: ['Start in high plank', 'Tap right hand to left shoulder', 'Replace hand', 'Tap left hand to right shoulder', 'Keep hips as still as possible'] },
  { name: 'Reverse Lunge with Twist', description: 'Lunge variation with thoracic rotation for legs, core, and mobility.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['legs', 'core', 'mobility'], equipment: ['bodyweight'], movement_type: 'both', instructions: ['Stand tall', 'Step right foot back into lunge', 'Rotate torso over front leg', 'Return to start', 'Alternate sides'] },
  { name: 'Bear Crawl', description: 'Full body crawling movement building core stability and coordination.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['full body', 'core'], equipment: ['bodyweight'], movement_type: 'strength', instructions: ['Start on all fours with knees 1 inch off ground', 'Move right hand and left foot forward simultaneously', 'Then left hand and right foot', 'Keep back flat and hips low'] },
  { name: 'Hip 90-90 Transitions', description: 'Hip mobility drill targeting internal and external rotation.', duration_estimate_seconds: 60, difficulty: 'beginner', muscle_groups: ['hips', 'mobility'], equipment: ['bodyweight'], movement_type: 'mobility', instructions: ['Sit with both knees bent at 90°, one in front and one to the side', 'Rotate hips to transition both knees to the opposite 90-90 position', 'Move slowly and with control'] },
  { name: "World's Greatest Stretch", description: 'Full body mobility drill hitting hips, thoracic spine, and hamstrings.', duration_estimate_seconds: 60, difficulty: 'beginner', muscle_groups: ['full body', 'mobility'], equipment: ['bodyweight'], movement_type: 'mobility', instructions: ['Start in lunge with right foot forward', 'Place right hand inside right foot on floor', 'Rotate right arm up to ceiling', 'Return hand to floor, straighten front leg for hamstring stretch', 'Repeat on other side'] },
  { name: 'Thruster (Squat to Press)', description: 'Front squat flowed directly into an overhead press — full body compound.', duration_estimate_seconds: 60, difficulty: 'intermediate', muscle_groups: ['legs', 'shoulders', 'core'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Hold dumbbells at shoulders', 'Squat to parallel', 'Drive up and press dumbbells overhead in one motion', 'Lower dumbbells as you descend into next squat'] },
  { name: 'Romanian Deadlift', description: 'Hip hinge movement targeting hamstrings, glutes, and lower back.', duration_estimate_seconds: 60, difficulty: 'intermediate', muscle_groups: ['hamstrings', 'glutes', 'back'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Hold dumbbells in front of thighs', 'Hinge at hips, pushing them back', 'Lower dumbbells along legs until hamstrings are fully stretched', 'Drive hips forward to stand'] },
  { name: 'Renegade Row', description: 'Plank row combining push-up stability with pulling strength.', duration_estimate_seconds: 60, difficulty: 'advanced', muscle_groups: ['back', 'core', 'chest'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Start in plank gripping dumbbells', 'Row right dumbbell to hip', 'Lower with control', 'Row left dumbbell to hip', 'Keep hips square throughout'] },
  { name: 'Dumbbell Clean and Press', description: 'Power movement from floor to overhead — full body.', duration_estimate_seconds: 60, difficulty: 'advanced', muscle_groups: ['full body', 'shoulders', 'legs'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Hinge and grip dumbbells', 'Explosively pull to shoulder height (clean)', 'Catch at shoulders', 'Press overhead', 'Lower with control'] },
  { name: 'Goblet Squat', description: 'Front-loaded squat great for quad depth and core bracing.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['legs', 'core'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Hold one dumbbell vertically at chest', 'Feet shoulder-width apart, toes slightly out', 'Squat deep, keeping chest up', 'Drive through heels to stand'] },
  { name: 'Lateral Lunge', description: 'Side lunge hitting inner thighs, glutes, and hip mobility.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['legs', 'glutes', 'mobility'], equipment: ['dumbbells'], movement_type: 'both', instructions: ['Hold dumbbells at sides', 'Step wide to the right', 'Bend right knee and push hips back', 'Keep left leg straight', 'Push off right foot to return', 'Alternate sides'] },
  { name: 'Dumbbell Snatch', description: 'Single-arm explosive movement from floor to overhead.', duration_estimate_seconds: 60, difficulty: 'advanced', muscle_groups: ['full body', 'shoulders', 'power'], equipment: ['dumbbells'], movement_type: 'strength', instructions: ['Hold one dumbbell between feet in a wide stance', 'Explosively drive hips and pull dumbbell overhead in one motion', 'Catch with arm locked out', 'Lower and repeat'] },
  { name: 'Pull-ups', description: 'Classic upper body pulling exercise.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['back', 'biceps'], equipment: ['pull-up bar'], movement_type: 'strength', instructions: ['Hang from bar with overhand grip', 'Pull chest to bar', 'Lower with control to full hang'] },
  { name: 'Hanging Knee Raises', description: 'Core exercise from a hang — targets abs and hip flexors.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['core', 'hip flexors'], equipment: ['pull-up bar'], movement_type: 'strength', instructions: ['Hang from bar', 'Draw knees to chest while keeping core tight', 'Lower with control'] },
  { name: 'Dead Hang + Shoulder Shrug', description: 'Decompresses the spine and builds shoulder mobility and grip.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['shoulders', 'grip', 'mobility'], equipment: ['pull-up bar'], movement_type: 'mobility', instructions: ['Hang from bar with relaxed shoulders', 'Shrug shoulders up toward ears', 'Hold 2 seconds', 'Let shoulders fully depress', 'Repeat'] },
  { name: 'Scapular Pull-ups', description: 'Shoulder health drill activating the serratus and lower traps.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['shoulders', 'back'], equipment: ['pull-up bar'], movement_type: 'both', instructions: ['Hang from bar with straight arms', 'Squeeze shoulder blades down and together slightly', 'Body rises a few inches without bending elbows', 'Lower back to dead hang'] },
  { name: 'Medicine Ball Slam', description: 'Power and explosive full body movement.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['full body', 'core', 'power'], equipment: ['medicine ball'], movement_type: 'strength', instructions: ['Hold MB overhead', 'Slam it to the floor as hard as possible', 'Catch on the bounce or pick up', 'Repeat'] },
  { name: 'MB Rotational Throw', description: 'Rotational power drill targeting the obliques and core.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['core', 'obliques'], equipment: ['medicine ball'], movement_type: 'strength', instructions: ['Stand sideways to a wall', 'Hold MB at hip', 'Rotate explosively and throw MB into wall', 'Catch and repeat'] },
  { name: 'MB Squat and Press', description: 'Full body compound movement with medicine ball.', duration_estimate_seconds: 45, difficulty: 'intermediate', muscle_groups: ['legs', 'shoulders', 'core'], equipment: ['medicine ball'], movement_type: 'strength', instructions: ['Hold MB at chest', 'Squat to parallel', 'Stand and press MB overhead', 'Lower MB as you descend'] },
];

const PODS = [
  { name: 'Power Starter', exerciseNames: ['Burpees', 'Jump Squats', 'Thruster (Squat to Press)', 'Mountain Climbers'] },
  { name: 'Mobility Flow', exerciseNames: ["World's Greatest Stretch", 'Hip 90-90 Transitions', 'Push-up to Downward Dog', 'Inchworm Walk-out'] },
  { name: 'Pull + Core', exerciseNames: ['Pull-ups', 'Hanging Knee Raises', 'Renegade Row', 'Plank Shoulder Taps'] },
  { name: 'Dumbbell Complex', exerciseNames: ['Romanian Deadlift', 'Goblet Squat', 'Dumbbell Clean and Press', 'Lateral Lunge'] },
  { name: 'Slam and Crawl', exerciseNames: ['Medicine Ball Slam', 'Bear Crawl', 'MB Rotational Throw', 'Reverse Lunge with Twist'] },
  { name: 'Shoulder Health', exerciseNames: ['Dead Hang + Shoulder Shrug', 'Scapular Pull-ups', 'Push-up to Downward Dog', 'Plank Shoulder Taps'] },
  { name: 'Advanced Power', exerciseNames: ['Dumbbell Snatch', 'Dumbbell Clean and Press', 'Jump Squats', 'Medicine Ball Slam'] },
  { name: 'Beginner Foundations', exerciseNames: ['Goblet Squat', 'Inchworm Walk-out', "World's Greatest Stretch", 'Dead Hang + Shoulder Shrug'] },
];

function calcPodType(exercises) {
  const total = exercises.length;
  if (total === 0) return 'hybrid';
  const sc = exercises.filter(e => e.movement_type === 'strength' || e.movement_type === 'both').length;
  const mc = exercises.filter(e => e.movement_type === 'mobility' || e.movement_type === 'both').length;
  if (sc / total > 0.7) return 'strength';
  if (mc / total > 0.7) return 'mobility';
  return 'hybrid';
}

export async function seedOnce(client) {
  const count = await client.scard('exercises:all');
  if (count > 0) return;

  console.log('Seeding exercises and pods…');
  const exerciseMap = {};
  for (const ex of EXERCISES) {
    const record = { id: randomId(), ...ex };
    await client.set(`exercises:${record.id}`, JSON.stringify(record));
    await client.sadd('exercises:all', record.id);
    exerciseMap[record.name] = record;
  }

  for (const pod of PODS) {
    const exercises = pod.exerciseNames.map(n => exerciseMap[n]).filter(Boolean);
    const record = {
      id: randomId(),
      name: pod.name,
      exercises: exercises.map(e => e.id),
      pod_type: calcPodType(exercises),
      total_duration_estimate_seconds: exercises.reduce((s, e) => s + e.duration_estimate_seconds, 0),
      is_favorite: false,
      created_at: Date.now(),
    };
    await client.set(`pods:${record.id}`, JSON.stringify(record));
    await client.sadd('pods:all', record.id);
  }

  console.log(`Seeded ${EXERCISES.length} exercises and ${PODS.length} pods.`);
}

export { calcPodType, randomId };
