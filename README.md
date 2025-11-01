# SaveTracker - Savings Management System

A professional, modern web application for managing personal savings goals, tracking transactions, and monitoring financial progress.

## 🌟 Features

### 💰 **Savings Management**
- Track multiple savings goals simultaneously
- Visual progress indicators with completion percentages
- Real-time savings statistics and analytics
- Goal milestone notifications

### 📊 **Dashboard Analytics**
- Comprehensive financial overview
- Monthly savings progress tracking
- Transaction history with categorization
- Performance metrics and growth indicators

### 🔐 **Authentication System**
- Professional login and signup forms
- Form validation with real-time feedback
- Responsive design for all devices
- Secure user session management

### 🎨 **Modern UI/UX**
- Built with Tailwind CSS for responsive design
- Professional gradient themes
- Smooth animations and transitions
- Mobile-first approach

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 🌐 Live Demo

Visit the application:
- **Local Development**: `http://localhost:5173`
- **Production**: Deploy using the instructions below

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx       # Main dashboard layout
│   ├── Header.jsx          # Navigation header
│   ├── Sidebar.jsx         # Navigation sidebar
│   ├── DashboardOverview.jsx # Dashboard main content
│   ├── Login.jsx           # Authentication - Login
│   └── Signup.jsx          # Authentication - Signup
├── assets/
│   └── logo.png           # Application logo
├── App.jsx                # Main app component
├── main.jsx              # Application entry point
└── index.css             # Global styles (Tailwind)
```

## 🔧 Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Build Tool**: Vite with Rolldown
- **Icons**: Heroicons (SVG)

## 🚀 Deployment

### Deploy to Render

This project includes a `render.yaml` configuration for easy deployment:

1. **Push to GitHub**: Commit and push your code
2. **Connect to Render**: Link your GitHub repository
3. **Auto-Deploy**: Render will detect the configuration automatically

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Manual Deployment

```bash
# Build the application
npm run build

# The dist/ folder contains the production build
# Deploy the contents to your hosting provider
```

## 🎯 Usage

### Getting Started
1. **Sign Up**: Create a new account or log in
2. **Set Goals**: Define your savings goals with target amounts
3. **Track Progress**: Add deposits and monitor your progress
4. **Analyze**: Use the dashboard to view analytics and reports

### Navigation
- **Overview**: Main dashboard with statistics and recent activity
- **Savings Goals**: Manage and track your financial goals
- **Transactions**: View and manage your transaction history
- **Analytics**: Detailed reports and financial insights
- **Settings**: Account preferences and configurations

## 🔐 Security Features

- Form validation and sanitization
- Secure routing with authentication checks
- XSS protection headers
- Content security policies

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard with sidebar navigation
- **Tablet**: Responsive layout with collapsible sidebar
- **Mobile**: Touch-optimized interface with bottom navigation

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

```env
VITE_APP_NAME=SaveTracker
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For questions or support, please contact the development team or open an issue on GitHub.

---

**SaveTracker** - Professional savings management made simple.
