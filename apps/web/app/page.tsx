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
  color,
}: {
  icon: any
  title: string
  description: string
  color: string
}) => (
  <motion.div
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <Card className="h-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-4">
        <div
          className={`w-14 h-14 rounded-lg ${color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-xl text-gray-900 font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  </motion.div>
)

const BenefitItem = ({ text }: { text: string }) => (
  <motion.li
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }}
    viewport={{ once: true }}
    className="flex items-center space-x-3 text-gray-700"
  >
    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
      <CheckCircle className="w-3 h-3 text-white" />
    </div>
    <span className="text-base">{text}</span>
  </motion.li>
)

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className="text-center group"
  >
    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-700 transition-colors duration-200">
      <span className="text-2xl font-semibold text-white">{number}</span>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
)

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const features = [
    {
      icon: Flag,
      title: "Feature Flags",
      description:
        "Control feature rollouts with precision. Enable or disable features instantly across your entire application without code deployments.",
      color: "bg-indigo-600",
    },
    {
      icon: TestTube,
      title: "A/B Testing",
      description:
        "Run sophisticated experiments to optimize user experience. Compare variations and make data-driven decisions with statistical confidence.",
      color: "bg-emerald-600",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description:
        "Stay informed with intelligent notifications about feature performance, user engagement, and system health in real-time.",
      color: "bg-amber-600",
    },
    {
      icon: Target,
      title: "User Targeting",
      description:
        "Deliver personalized experiences with advanced user segmentation based on attributes, behavior, and custom criteria.",
      color: "bg-purple-600",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Comprehensive insights into feature adoption, performance metrics, and user engagement with beautiful, actionable dashboards.",
      color: "bg-pink-600",
    },
    {
      icon: Shield,
      title: "Safe Deployments",
      description:
        "Deploy with confidence using gradual rollouts, automatic rollbacks, and kill switches to protect your users and business.",
      color: "bg-red-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Bitswitch</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button 
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 font-medium rounded-lg"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-medium rounded-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Modern Feature Management
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants} 
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900"
          >
            Ship Features
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              With Confidence
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Take control of your feature releases with powerful flags, sophisticated A/B testing, and real-time
            insights. Deploy safely, experiment boldly, and deliver exceptional user experiences.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg font-medium rounded-lg"
              >
                Get Started
                <Rocket className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 px-8 py-3 text-lg font-medium rounded-lg"
            >
              <Code2 className="mr-3 w-5 h-5" />
              Documentation
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Comprehensive tools designed for modern development teams who demand reliability, flexibility, and
              performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple Integration</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get up and running in minutes with our developer-friendly approach
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Install SDK"
              description="Add our lightweight SDK to your application with a single command. Works with all major frameworks."
            />
            <StepCard
              number="2"
              title="Configure Flags"
              description="Create feature flags and define targeting rules through our intuitive dashboard interface."
            />
            <StepCard
              number="3"
              title="Deploy & Monitor"
              description="Release features with confidence and monitor performance with real-time analytics and alerts."
            />
          </div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Why Choose Flagship Feat</h2>
              <ul className="space-y-4">
                <BenefitItem text="Deploy features without fear of breaking production environments" />
                <BenefitItem text="Test new ideas with real users before committing to full rollout" />
                <BenefitItem text="Instant rollbacks and kill switches for immediate issue resolution" />
                <BenefitItem text="Granular control over feature visibility and user targeting" />
                <BenefitItem text="Real-time monitoring with intelligent alerting systems" />
                <BenefitItem text="Seamless integration with your existing development workflow" />
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 font-bold">Built for Scale</CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    Enterprise-grade infrastructure that grows with your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">High Performance</h4>
                      <p className="text-gray-600">Lightning-fast flag evaluation with global edge network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Developer Friendly</h4>
                      <p className="text-gray-600">Intuitive APIs and comprehensive documentation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Deployments?</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join development teams who trust Flagship Feat to deliver better software, faster and safer.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 text-xl font-medium rounded-lg"
              >
                Get Started Today
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
