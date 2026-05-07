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
  // Core exercises
  { name: 'Dead Bug', description: 'Anti-extension core stability drill that trains deep abdominals.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['core', 'abs'], equipment: ['bodyweight'], movement_type: 'core', instructions: ['Lie on back, arms straight up, knees at 90°', 'Lower right arm and left leg toward floor simultaneously', 'Keep lower back pressed into floor', 'Return and alternate sides'] },
  { name: 'Hollow Body Hold', description: 'Gymnastics-style isometric that builds total core tension.', duration_estimate_seconds: 30, difficulty: 'intermediate', muscle_groups: ['core', 'abs', 'hip flexors'], equipment: ['bodyweight'], movement_type: 'core', instructions: ['Lie on back', 'Press lower back into floor', 'Lift shoulders and legs to create a boat shape', 'Arms reach overhead', 'Hold position breathing steadily'] },
  { name: 'Copenhagen Side Plank', description: 'Adductor and oblique strengthener from a side plank position.', duration_estimate_seconds: 30, difficulty: 'advanced', muscle_groups: ['core', 'obliques', 'adductors'], equipment: ['bodyweight'], movement_type: 'core', instructions: ['Place top foot on a bench or chair', 'Press into side plank', 'Lift bottom leg to meet top foot', 'Hold or pulse', 'Switch sides'] },
  { name: 'Pallof Press Hold', description: 'Anti-rotation isometric using a band or cable to challenge core stability.', duration_estimate_seconds: 30, difficulty: 'intermediate', muscle_groups: ['core', 'obliques'], equipment: ['resistance band'], movement_type: 'core', instructions: ['Attach band to anchor at chest height', 'Stand side-on and hold band at chest', 'Press arms out straight and hold', 'Resist the pull — do not rotate', 'Switch sides'] },
  { name: 'V-Ups', description: 'Dynamic core exercise targeting the entire abdominal wall.', duration_estimate_seconds: 40, difficulty: 'intermediate', muscle_groups: ['abs', 'core', 'hip flexors'], equipment: ['bodyweight'], movement_type: 'core', instructions: ['Lie flat, arms extended overhead', 'Simultaneously lift arms and legs toward each other', 'Reach fingers toward toes at the top', 'Lower with control'] },
  { name: 'Bird Dog', description: 'Contralateral core stability drill that also targets the glutes and back.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['core', 'glutes', 'back'], equipment: ['bodyweight'], movement_type: 'core', instructions: ['Start on all fours, wrists under shoulders, knees under hips', 'Extend right arm and left leg simultaneously', 'Hold 2 seconds at the top', 'Return without touching floor', 'Alternate sides'] },
  // Bedtime / recovery exercises
  { name: 'Supine Spinal Twist', description: 'Gentle lying twist that releases tension in the lower back and hips.', duration_estimate_seconds: 60, difficulty: 'beginner', muscle_groups: ['back', 'hips', 'mobility'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Lie on back', 'Hug right knee to chest', 'Let it fall across body to the left', 'Extend right arm to the right', 'Look right if comfortable', 'Hold then switch sides'] },
  { name: "Child's Pose", description: 'Restorative resting position that releases the hips, thighs, and lower back.', duration_estimate_seconds: 60, difficulty: 'beginner', muscle_groups: ['hips', 'back', 'shoulders'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Kneel and sit back on heels', 'Reach arms forward on the floor', 'Rest forehead down', 'Breathe deeply into the back body', 'Hold'] },
  { name: 'Legs Up The Wall', description: 'Restorative inversion that calms the nervous system and reduces leg fatigue.', duration_estimate_seconds: 120, difficulty: 'beginner', muscle_groups: ['legs', 'back', 'mobility'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Sit sideways against a wall', 'Swing legs up the wall as you lie back', 'Keep legs straight and relaxed', 'Arms out to sides, palms up', 'Close eyes and breathe slowly'] },
  { name: 'Diaphragmatic Breathing', description: 'Deep belly breathing that activates the parasympathetic nervous system.', duration_estimate_seconds: 120, difficulty: 'beginner', muscle_groups: ['core', 'mobility'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Lie on back with knees bent', 'Place one hand on chest, one on belly', 'Inhale slowly through nose, belly rises', 'Exhale through pursed lips, belly falls', 'Repeat 8–10 breaths'] },
  { name: 'Cat-Cow Stretch', description: 'Gentle spinal mobility flow to release back tension before sleep.', duration_estimate_seconds: 60, difficulty: 'beginner', muscle_groups: ['back', 'core', 'mobility'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Start on all fours', 'Inhale — drop belly, lift head and tailbone (Cow)', 'Exhale — round spine, tuck chin and pelvis (Cat)', 'Flow slowly between positions'] },
  { name: 'Neck and Shoulder Rolls', description: 'Gentle mobility work to release tension accumulated from sitting or screens.', duration_estimate_seconds: 45, difficulty: 'beginner', muscle_groups: ['neck', 'shoulders', 'mobility'], equipment: ['bodyweight'], movement_type: 'recovery', instructions: ['Sit or stand tall', 'Slowly roll head in a half-circle side to side', 'Roll shoulders back 5 times, then forward 5 times', 'Move slowly — no forcing'] },
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
  { name: 'Core Foundations', exerciseNames: ['Dead Bug', 'Bird Dog', 'Hollow Body Hold', 'Plank Shoulder Taps'] },
  { name: 'Core Burn', exerciseNames: ['Hollow Body Hold', 'V-Ups', 'Copenhagen Side Plank', 'Mountain Climbers'] },
  { name: 'Bedtime Wind-Down', exerciseNames: ["Child's Pose", 'Supine Spinal Twist', 'Diaphragmatic Breathing', 'Legs Up The Wall'] },
  { name: 'Evening Release', exerciseNames: ['Cat-Cow Stretch', 'Neck and Shoulder Rolls', "Child's Pose", 'Supine Spinal Twist'] },
];

function calcPodType(exercises) {
  const total = exercises.length;
  if (total === 0) return 'hybrid';
  const rc = exercises.filter(e => e.movement_type === 'recovery').length;
  const cc = exercises.filter(e => e.movement_type === 'core').length;
  const sc = exercises.filter(e => e.movement_type === 'strength' || e.movement_type === 'both').length;
  const mc = exercises.filter(e => e.movement_type === 'mobility' || e.movement_type === 'both').length;
  if (rc / total > 0.5) return 'bedtime';
  if (cc / total > 0.5) return 'core';
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
      is_favourite: false,
      created_at: Date.now(),
    };
    await client.set(`pods:${record.id}`, JSON.stringify(record));
    await client.sadd('pods:all', record.id);
  }

  console.log(`Seeded ${EXERCISES.length} exercises and ${PODS.length} pods.`);
}

export { calcPodType, randomId };
