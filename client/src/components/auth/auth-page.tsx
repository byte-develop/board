import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kanban } from 'lucide-react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Kanban className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                TaskFlow Pro
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Smart Project Management</p>
            </div>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Streamline Your
            <span className="bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent block">
              Project Workflow
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Powerful Kanban boards with AI assistance, real-time collaboration, 
            and advanced analytics to boost your team's productivity.
          </p>
          
          <div className="space-y-4 text-left max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">AI-powered task optimization</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Real-time drag & drop interface</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Advanced analytics & reporting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Multi-device responsive design</span>
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth Forms */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm 
                key="login"
                onSwitchToRegister={() => setIsLogin(false)} 
              />
            ) : (
              <RegisterForm 
                key="register"
                onSwitchToLogin={() => setIsLogin(true)} 
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}