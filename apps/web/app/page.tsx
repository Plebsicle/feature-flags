"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  Flag,
  TestTube,
  Bell,
  Shield,
  BarChart3,
  Code2,
  Rocket,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Activity,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: any
  title: string
  description: string
  gradient: string
}) => (
  <motion.div
    whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
    whileTap={{ scale: 0.97, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-400 ease-in-out`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-xl text-neutral-100 font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-neutral-400 leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  </motion.div>
)

const BenefitItem = ({ text }: { text: string }) => (
  <motion.li
    initial={{ opacity: 0, x: -30 }}
    whileInView={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
    viewport={{ once: true }}
    className="flex items-center space-x-3 text-neutral-300"
  >
    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
    <span className="text-base">{text}</span>
  </motion.li>
)

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Slightly increased stagger
        duration: 0.7,
        ease: "easeInOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 }, // Increased initial y offset for more noticeable animation
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }, // Slower duration, smoother ease
  }

  const features = [
    {
      icon: Flag,
      title: "Feature Flags",
      description:
        "Control feature rollouts with precision. Enable or disable features instantly across your entire application without code deployments.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: TestTube,
      title: "A/B Testing",
      description:
        "Run sophisticated experiments to optimize user experience. Compare variations and make data-driven decisions with statistical confidence.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description:
        "Stay informed with intelligent notifications about feature performance, user engagement, and system health in real-time.",
      gradient: "from-orange-500 to-amber-600",
    },
    {
      icon: Target,
      title: "User Targeting",
      description:
        "Deliver personalized experiences with advanced user segmentation based on attributes, behavior, and custom criteria.",
      gradient: "from-purple-500 to-violet-600",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Comprehensive insights into feature adoption, performance metrics, and user engagement with beautiful, actionable dashboards.",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: Shield,
      title: "Safe Deployments",
      description:
        "Deploy with confidence using gradual rollouts, automatic rollbacks, and kill switches to protect your users and business.",
      gradient: "from-red-500 to-pink-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Flagship Feat</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-slate-800/50 px-6">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Modern Feature Management
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Ship Features
            </span>
            <br />
            <span className="text-white">With Confidence</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Take control of your feature releases with powerful flags, sophisticated A/B testing, and real-time
            insights. Deploy safely, experiment boldly, and deliver exceptional user experiences.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold rounded-xl"
              >
                Get Started
                <Rocket className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-neutral-300 hover:bg-slate-800/50 hover:border-slate-600 px-10 py-6 text-lg font-semibold rounded-xl"
            >
              <Code2 className="mr-3 w-5 h-5" />
              Documentation
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }} // Trigger when 20% of section is visible
          className="max-w-7xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">Everything You Need</h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools designed for modern development teams who demand reliability, flexibility, and
              performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants} custom={index}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 lg:px-8 bg-slate-900/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">Simple Integration</h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Get up and running in minutes with our developer-friendly approach
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-400 ease-in-out">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Install SDK</h3>
              <p className="text-neutral-400 leading-relaxed">
                Add our lightweight SDK to your application with a single command. Works with all major frameworks.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-400 ease-in-out">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Configure Flags</h3>
              <p className="text-neutral-400 leading-relaxed">
                Create feature flags and define targeting rules through our intuitive dashboard interface.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-400 ease-in-out">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Deploy & Monitor</h3>
              <p className="text-neutral-400 leading-relaxed">
                Release features with confidence and monitor performance with real-time analytics and alerts.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants}>
              <h2 className="text-5xl font-bold text-white mb-8">Why Choose Flagship Feat</h2>
              <ul className="space-y-6">
                <BenefitItem text="Deploy features without fear of breaking production environments" />
                <BenefitItem text="Test new ideas with real users before committing to full rollout" />
                <BenefitItem text="Instant rollbacks and kill switches for immediate issue resolution" />
                <BenefitItem text="Granular control over feature visibility and user targeting" />
                <BenefitItem text="Real-time monitoring with intelligent alerting systems" />
                <BenefitItem text="Seamless integration with your existing development workflow" />
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl" />
              <Card className="relative bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-3xl text-white font-bold">Built for Scale</CardTitle>
                  <CardDescription className="text-neutral-400 text-lg">
                    Enterprise-grade infrastructure that grows with your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Activity className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white text-lg">High Performance</h4>
                      <p className="text-neutral-400">Lightning-fast flag evaluation with global edge network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Shield className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white text-lg">Secure & Reliable</h4>
                      <p className="text-neutral-400">Bank-grade security with 99.9% uptime guarantee</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Settings className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white text-lg">Developer Friendly</h4>
                      <p className="text-neutral-400">Intuitive APIs and comprehensive documentation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="pt-16 pb-24 px-6 lg:px-8">
        {" "}
        {/* Reduced top padding here */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl border border-blue-500/20 p-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">Ready to Transform Your Deployments?</h2>
            <p className="text-xl text-neutral-400 mb-10 leading-relaxed">
              Join development teams who trust Flagship Feat to deliver better software, faster and safer.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-xl font-semibold rounded-xl"
              >
                Get Started Today
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-neutral-500">© 2024 Flagship Feat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
