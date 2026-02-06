# 🏆 Scarlet Trophies - Nintendo Achievement Tracker

A modern web application for tracking Nintendo Switch game achievements and trophies, built with Next.js, TypeScript, and Prisma. Follows Nintendo's visual design principles for a clean, playful, and user-friendly experience.

## ✨ Features

- **Game Library Management**: Add and organize your Nintendo Switch games
- **Achievement Tracking**: Create and track custom achievements for each game
- **Trophy System**: Earn trophies for completing special challenges
- **User Dashboard**: View your progress and recent accomplishments
- **Nintendo-Inspired Design**: Clean, playful UI following Nintendo's visual identity
- **Authentication**: Secure user accounts with Clerk
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎮 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Testing**: Jest with React Testing Library
- **Deployment**: Ready for Vercel deployment

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trophy-rooms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/trophy_rooms"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   CLERK_SECRET_KEY="your_clerk_secret_key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run tests in watch mode
npm test -- --watch
```

## 📁 Project Structure

```
trophy-rooms/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── games/             # Game management pages
│   │   ├── achievements/      # Achievement pages
│   │   └── dashboard/         # User dashboard
│   ├── components/            # Reusable React components
│   └── __tests__/            # Test files
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── terraform/               # Infrastructure as Code
```

## 🎨 Design System

The application follows Nintendo's visual identity guidelines:

- **Colors**: Nintendo Red (#E60012), clean whites and grays
- **Typography**: Nunito font family for a friendly, rounded feel
- **Components**: Rounded corners, subtle shadows, playful interactions
- **Layout**: Clean, spacious design with clear information hierarchy

## 🔧 API Endpoints

### Games
- `GET /api/games` - List all games
- `POST /api/games` - Create a new game
- `GET /api/games/[id]` - Get game details
- `PUT /api/games/[id]` - Update game
- `DELETE /api/games/[id]` - Delete game

### Achievements
- `GET /api/achievements` - List all achievements
- `POST /api/achievements` - Create a new achievement

### User Achievements
- `GET /api/user-achievements` - Get user's completed achievements
- `POST /api/user-achievements` - Mark achievement as completed

## 🗄️ Database Schema

The application uses the following main entities:

- **User**: User accounts and profiles
- **Game**: Nintendo Switch games in the library
- **Achievement**: Custom achievements for each game
- **UserAchievement**: User's completed achievements
- **Trophy**: Special trophies earned by users

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Nintendo for the visual design inspiration
- Next.js team for the amazing framework
- Clerk for authentication services
- Prisma for the excellent ORM

---

**Note**: This project is not affiliated with Nintendo. It's a fan-made application for tracking gaming achievements.
