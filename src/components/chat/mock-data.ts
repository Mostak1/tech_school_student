// app/components/chat/mock-data.ts

export const contacts = [
  {
    id: 1,
    name: 'Asgar Luhar',
    lastMessage: 'Demo......',
    time: '01:20 pm',
    avatar: 'AL',
    unread: 0,
    active: false,
  },
  {
    id: 2,
    name: 'Chirag rajgor',
    lastMessage: 'Testing....',
    time: '11:02 pm',
    avatar: 'CR',
    unread: 0,
    active: false,
  },
  {
    id: 3,
    name: 'Divy Jani',
    lastMessage: 'Demo......',
    time: '01:20 pm',
    avatar: 'DJ',
    unread: 2,
    active: true,
  },
  {
    id: 4,
    name: 'Laxmi Hirani',
    lastMessage: 'helloo......',
    time: '04:20 pm',
    avatar: 'LH',
    unread: 0,
    active: false,
  },
  {
    id: 5,
    name: 'Rajendra Jadeja',
    lastMessage: 'helloo......',
    time: '05:20 pm',
    avatar: 'RJ',
    unread: 0,
    active: false,
  },
  {
    id: 6,
    name: 'Ansh Gor',
    lastMessage: 'helloo......',
    time: '06:20 pm',
    avatar: 'AG',
    unread: 0,
    active: false,
  },
  {
    id: 7,
    name: 'Aditya Gohil',
    lastMessage: 'helloo......',
    time: '06:20 pm',
    avatar: 'AG',
    unread: 0,
    active: false,
  },
];

export const messages = [
  {
    id: 1,
    type: 'date',
    content: 'June 25, 2025',
  },
  {
    id: 2,
    sender: 'Divy Jani',
    isSender: false,
    time: '10:02 am',
    status: 'read',
    content:
      "Hi Ananya, please find today's homework below. Let me know if you have any questions.",
    attachment: {
      name: 'Biology_Chapter5_Assignment.pdf',
      size: '1.8 MB',
    },
  },
  {
    id: 3,
    sender: 'You',
    isSender: true,
    time: '10:09 am',
    status: 'sent',
    content:
      "Thank you, sir! I've downloaded it. Just one quick doubt on diagram 2. Should we label all parts?",
    images: [
      'https://placehold.co/150x150/e0e7ff/3730a3?text=Img1',
      'https://placehold.co/150x150/d1fae5/047857?text=Img2',
      'https://placehold.co/150x150/fefce8/854d0e?text=Img3',
      'https://placehold.co/150x150/fefce8/854d0e?text=Img4',
      'https://placehold.co/150x150/f3e8ff/7c3aed?text=Img5',
      'https://placehold.co/150x150/fef2f2/f87171?text=Img6',
      'https://placehold.co/150x150/ecfdf5/10b981?text=Img7',
      'https://placehold.co/150x150/f0f9ff/0ea5e9?text=Img8',
      'https://placehold.co/150x150/fefce8/f59e0b?text=Img9',
      'https://placehold.co/150x150/fdf2f8/ec4899?text=Img10',
    ],
  },
];
