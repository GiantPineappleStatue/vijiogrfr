import { Tutorial } from '../../features/learning/learningSlice';
import { v4 as uuidv4 } from 'uuid';

// Sample tutorials for demonstration
const SampleTutorials: Tutorial[] = [
  // Blender Beginner Tutorials
  {
    id: uuidv4(),
    title: 'Blender Basics: Interface Navigation',
    description: 'Learn how to navigate the Blender interface and understand the essential controls.',
    softwareTarget: 'blender',
    difficulty: 'beginner',
    estimatedTimeMinutes: 15,
    category: 'basics',
    tags: ['navigation', 'interface', 'getting started'],
    steps: [
      {
        id: uuidv4(),
        title: 'The Blender Interface',
        description: 'Overview of the Blender interface with its various panels and workspaces. The Blender interface is divided into several areas that can be customized based on your workflow.',
        targetAction: 'Familiarize yourself with the Blender interface layout',
        verificationMethod: 'userConfirmation',
        hints: [
          'The main area in the center is the 3D Viewport where you work with your objects',
          'The Properties panel on the right contains settings for objects and scenes',
          'The Outliner in the top-right shows the hierarchy of objects in your scene'
        ],
        imageUrl: 'https://docs.blender.org/manual/en/latest/_images/interface_window-system_introduction_default-startup.png'
      },
      {
        id: uuidv4(),
        title: 'Navigating the 3D Viewport',
        description: 'Learn how to move around in the 3D viewport using your mouse and keyboard shortcuts.',
        targetAction: 'Practice navigation techniques in the 3D viewport',
        verificationMethod: 'userConfirmation',
        hints: [
          'Middle mouse button to orbit the view',
          'Shift + Middle mouse button to pan',
          'Scroll wheel to zoom in and out',
          'Numpad 1, 3, 7 for front, side, and top views'
        ]
      },
      {
        id: uuidv4(),
        title: 'Selecting Objects',
        description: 'Learn different ways to select objects in Blender.',
        targetAction: 'Practice selecting objects in different ways',
        verificationMethod: 'userConfirmation',
        hints: [
          'Right-click to select an object',
          'Shift + Right-click to select multiple objects',
          'B key for box select',
          'C key for circle select'
        ]
      },
      {
        id: uuidv4(),
        title: 'Moving, Rotating, and Scaling',
        description: 'Learn the basic transformation tools to manipulate objects in 3D space.',
        targetAction: 'Practice transforming the default cube',
        verificationMethod: 'userConfirmation',
        hints: [
          'G key for grab/move',
          'R key for rotate',
          'S key for scale',
          'Press X, Y, or Z after to constrain to an axis'
        ]
      },
      {
        id: uuidv4(),
        title: 'Using the Properties Panel',
        description: 'Get familiar with the Properties panel which contains all settings for objects, materials, and scenes.',
        targetAction: 'Explore the Properties panel tabs',
        verificationMethod: 'userConfirmation',
        hints: [
          'Each icon in the Properties panel opens a different set of options',
          'The Object tab contains transformation settings',
          'The Material tab allows you to edit material properties'
        ]
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Creating Your First 3D Model in Blender',
    description: 'Learn how to create a simple 3D model from scratch using Blender\'s modeling tools.',
    softwareTarget: 'blender',
    difficulty: 'beginner',
    estimatedTimeMinutes: 30,
    category: 'modeling',
    tags: ['modeling', '3D', 'mesh editing'],
    steps: [
      {
        id: uuidv4(),
        title: 'Starting a New Project',
        description: 'Learn how to set up a new Blender project and configure your workspace for modeling.',
        targetAction: 'Open Blender and start a new project',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use File > New > General to start a fresh project',
          'Switch to the Modeling workspace using the tabs at the top',
          'Delete the default cube with X key if you want to start from scratch'
        ]
      },
      {
        id: uuidv4(),
        title: 'Adding Basic Shapes',
        description: 'Learn how to add primitive shapes like cubes, spheres, and cylinders as a starting point for your model.',
        targetAction: 'Add a new primitive shape to your scene',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use Shift + A to open the Add menu',
          'Select Mesh to see the available primitive shapes',
          'After adding a shape, you can adjust its parameters in the popup panel'
        ]
      },
      {
        id: uuidv4(),
        title: 'Edit Mode and Mesh Editing',
        description: 'Learn how to enter Edit Mode and modify your mesh at the vertex, edge, and face level.',
        targetAction: 'Enter Edit Mode and make basic modifications',
        verificationMethod: 'userConfirmation',
        hints: [
          'Press Tab to toggle between Object Mode and Edit Mode',
          'In Edit Mode, use the buttons at the top to switch between Vertex, Edge, and Face selection modes',
          'Use E to extrude selected vertices, edges, or faces'
        ]
      },
      {
        id: uuidv4(),
        title: 'Using Modifiers',
        description: 'Learn how to use Blender's modifier system to apply procedural effects to your models.',
        targetAction: 'Apply a modifier to your object',
        verificationMethod: 'userConfirmation',
        hints: [
          'Open the Properties panel and click on the wrench icon',
          'Click "Add Modifier" and select one from the list',
          'Subdivision Surface is good for smoothing models',
          'Mirror is useful for symmetrical modeling'
        ]
      },
      {
        id: uuidv4(),
        title: 'Saving Your Model',
        description: 'Learn how to save your work and export it for use in other applications.',
        targetAction: 'Save your Blender file and export your model',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use Ctrl + S or File > Save to save your Blender file',
          'Use File > Export to save in formats like OBJ or FBX',
          'Remember to check the export settings to ensure compatibility'
        ]
      }
    ]
  },

  // After Effects Beginner Tutorials
  {
    id: uuidv4(),
    title: 'After Effects Fundamentals',
    description: 'Get started with Adobe After Effects by learning the interface and basic workflows.',
    softwareTarget: 'afterEffects',
    difficulty: 'beginner',
    estimatedTimeMinutes: 20,
    category: 'basics',
    tags: ['interface', 'basics', 'getting started'],
    steps: [
      {
        id: uuidv4(),
        title: 'Understanding the After Effects Interface',
        description: 'Familiarize yourself with the After Effects workspace, panels, and tools.',
        targetAction: 'Explore the After Effects interface',
        verificationMethod: 'userConfirmation',
        hints: [
          'The Project panel shows your imported assets',
          'The Composition panel is your visual workspace',
          'The Timeline panel shows layers and animation timing',
          'Try different workspace layouts from the Window > Workspaces menu'
        ]
      },
      {
        id: uuidv4(),
        title: 'Creating a New Composition',
        description: 'Learn how to create a new composition with the right settings for your project.',
        targetAction: 'Create a new composition',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use Composition > New Composition or Ctrl+N',
          'Set the resolution, frame rate, and duration based on your output needs',
          'Common resolutions are 1920x1080 (Full HD) and 3840x2160 (4K)'
        ]
      },
      {
        id: uuidv4(),
        title: 'Importing Assets',
        description: 'Learn how to import images, videos, and other assets into your After Effects project.',
        targetAction: 'Import assets into your project',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use File > Import or Ctrl+I',
          'You can also drag files directly from Explorer/Finder',
          'After Effects supports various file formats including AI, PSD, JPG, PNG, and MP4'
        ]
      },
      {
        id: uuidv4(),
        title: 'Working with Layers',
        description: 'Understand how layers work in After Effects and how to organize them.',
        targetAction: 'Add and manipulate layers in your composition',
        verificationMethod: 'userConfirmation',
        hints: [
          'Drag assets from the Project panel to the Timeline panel to create layers',
          'Layers are stacked from bottom to top',
          'Use the Transform properties to move, scale, and rotate layers',
          'The Eye icon toggles layer visibility'
        ]
      },
      {
        id: uuidv4(),
        title: 'Previewing and Rendering',
        description: 'Learn how to preview your work and render the final output.',
        targetAction: 'Preview and render a simple composition',
        verificationMethod: 'userConfirmation',
        hints: [
          'Press Spacebar to preview your composition',
          'Use the RAM Preview button for smoother playback',
          'Render with Composition > Add to Render Queue',
          'Set output format and location in the Render Queue panel'
        ]
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Basic Animation in After Effects',
    description: 'Learn the fundamentals of animation with keyframes and motion paths in After Effects.',
    softwareTarget: 'afterEffects',
    difficulty: 'beginner',
    estimatedTimeMinutes: 25,
    category: 'animation',
    tags: ['animation', 'keyframes', 'motion'],
    steps: [
      {
        id: uuidv4(),
        title: 'Understanding Keyframes',
        description: 'Learn what keyframes are and how they control animation in After Effects.',
        targetAction: 'Understand the concept of keyframes',
        verificationMethod: 'userConfirmation',
        hints: [
          'Keyframes mark the beginning and end points of a transition',
          'After Effects interpolates between keyframes to create animation',
          'Keyframes can be applied to almost any property'
        ]
      },
      {
        id: uuidv4(),
        title: 'Creating Position Animation',
        description: 'Learn how to animate an object moving from one position to another.',
        targetAction: 'Create a simple position animation',
        verificationMethod: 'userConfirmation',
        hints: [
          'Select a layer and press P to reveal Position properties',
          'Click the stopwatch icon to create a keyframe at the current time',
          'Move the playhead to a different time, change the position, and a new keyframe is created automatically',
          'Press the spacebar to preview your animation'
        ]
      },
      {
        id: uuidv4(),
        title: 'Animating Scale and Rotation',
        description: 'Learn how to make objects grow, shrink, and rotate over time.',
        targetAction: 'Create scale and rotation animations',
        verificationMethod: 'userConfirmation',
        hints: [
          'Press S to reveal Scale properties',
          'Press R to reveal Rotation properties',
          'Use the same keyframing technique as with Position',
          'You can animate multiple properties simultaneously'
        ]
      },
      {
        id: uuidv4(),
        title: 'Working with the Graph Editor',
        description: 'Learn how to use the Graph Editor to fine-tune your animations.',
        targetAction: 'Open and use the Graph Editor',
        verificationMethod: 'userConfirmation',
        hints: [
          'Select a layer with keyframes and press Shift+F3 to open the Graph Editor',
          'The Graph Editor shows animation curves',
          'Adjust the curves to change how properties interpolate between keyframes',
          'Use handles to create easing for smoother animation'
        ]
      },
      {
        id: uuidv4(),
        title: 'Creating a Motion Path',
        description: 'Learn how to create and edit complex motion paths for your animations.',
        targetAction: 'Create a custom motion path',
        verificationMethod: 'userConfirmation',
        hints: [
          'With Position keyframes selected, you'll see a path in the Composition panel',
          'Click and drag directly on the path to add and adjust points',
          'Hold Ctrl/Cmd while dragging to create curved paths',
          'Right-click on keyframes for additional options like easing'
        ]
      }
    ]
  },

  // Cross-software tutorial
  {
    id: uuidv4(),
    title: 'Blender to After Effects Workflow',
    description: 'Learn how to create 3D elements in Blender and integrate them into your After Effects compositions.',
    softwareTarget: 'both',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 45,
    category: 'integration',
    tags: ['3D', 'integration', 'workflow', 'rendering'],
    steps: [
      {
        id: uuidv4(),
        title: 'Planning Your Project',
        description: 'Understand how to plan a project that involves both Blender and After Effects.',
        targetAction: 'Create a simple project plan',
        verificationMethod: 'userConfirmation',
        hints: [
          'Decide which elements will be created in Blender vs After Effects',
          'Consider file formats and how data will transfer between applications',
          'Think about render settings that will make integration easier'
        ]
      },
      {
        id: uuidv4(),
        title: 'Creating 3D Elements in Blender',
        description: 'Create a simple 3D element in Blender that will be exported for After Effects.',
        targetAction: 'Create a 3D element in Blender',
        verificationMethod: 'userConfirmation',
        hints: [
          'Create a simple model or scene in Blender',
          'Consider using a plain background or transparent background for easier compositing',
          'Apply materials and textures as needed'
        ]
      },
      {
        id: uuidv4(),
        title: 'Rendering from Blender',
        description: 'Learn how to render your 3D elements with the right settings for After Effects.',
        targetAction: 'Render your Blender scene',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use PNG or OpenEXR format for best quality and alpha support',
          'Consider rendering separate passes (color, shadow, reflection) for more control in After Effects',
          'For animations, render as an image sequence'
        ]
      },
      {
        id: uuidv4(),
        title: 'Importing into After Effects',
        description: 'Import your Blender renders into After Effects and set up your composition.',
        targetAction: 'Import the Blender render into After Effects',
        verificationMethod: 'userConfirmation',
        hints: [
          'Import your renders using File > Import',
          'If using an image sequence, check the "Image Sequence" option',
          'Create a new composition that matches your render dimensions'
        ]
      },
      {
        id: uuidv4(),
        title: 'Compositing and Final Touches',
        description: 'Integrate your 3D elements with other elements in After Effects and add final effects.',
        targetAction: 'Composite your 3D elements with other content',
        verificationMethod: 'userConfirmation',
        hints: [
          'Use blending modes to integrate your 3D elements',
          'Add effects like glow, color correction, or motion blur as needed',
          'Consider adding camera moves in After Effects to enhance 3D feeling'
        ]
      }
    ]
  }
];

export default SampleTutorials;
