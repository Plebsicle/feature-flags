"use client"

import { motion,easeOut } from "framer-motion"
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
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: React.ElementType
  title: string
  description: string
  comingSoon?: boolean
}) => (
  <motion.div
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <Card className="h-full bg-card/80 backdrop-blur border-border rounded-xl hover:border-primary/50 transition-all duration-200 group relative shadow-sm">
      {comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
            Coming Soon
          </span>
        </div>
      )}
      <CardHeader className="pb-4">
        <div
          className={`w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-xl text-foreground font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  </motion.div>
)

const BenefitItem = ({ text }: { text: string }) => (
  <motion.li
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } }}
    viewport={{ once: true }}
    className="flex items-center space-x-3 text-foreground"
  >
    <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
      <CheckCircle className="w-3 h-3 text-emerald-500" />
    </div>
    <span className="text-sm font-medium">{text}</span>
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
    <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-200">
      <span className="text-2xl font-bold text-primary">{number}</span>
    </div>
    <h3 className="text-xl font-semibold tracking-tight text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
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
        ease: easeOut,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  }

  const features = [
    {
      icon: Flag,
      title: "Feature Flags",
      description:
        "Control feature rollouts with precision. Enable or disable features instantly across your entire application without code deployments.",
    },
    {
      icon: TestTube,
      title: "A/B Testing",
      description:
        "Run sophisticated experiments to optimize user experience. Compare variations and make data-driven decisions with statistical confidence.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description:
        "Stay informed with intelligent notifications about feature performance, user engagement, and system health in real-time.",
    },
    {
      icon: Target,
      title: "User Targeting",
      description:
        "Deliver personalized experiences with advanced user segmentation based on attributes, behavior, and custom criteria.",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Comprehensive insights into feature adoption, performance metrics, and user engagement with beautiful, actionable dashboards.",
      comingSoon: true,
    },
    {
      icon: Shield,
      title: "Safe Deployments",
      description:
        "Deploy with confidence using gradual rollouts, automatic rollbacks, and kill switches to protect your users and business.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } }}
        className="fixed top-0 left-0 right-0 z-50 bg-card/80 border-b border-border backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Bitswitch</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="https://app.bitswitch.site/auth/signin">
                <Button 
                  variant="outline"
                  className="rounded-lg text-sm font-medium px-4 py-2 hover:bg-muted/50 border-border"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="https://app.bitswitch.site/auth/signin/">
                <Button 
                  className="rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2"
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
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-tight">
              <Zap className="w-4 h-4 mr-2" />
              Modern Feature Management
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants} 
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-foreground"
          >
            Ship Features
            <br />
            <span className="text-primary">
              With Confidence
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Take control of your feature releases with powerful flags, sophisticated A/B testing, and real-time
            insights. Deploy safely, experiment boldly, and deliver exceptional user experiences.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://app.bitswitch.site/auth/signup">
              <Button
                size="lg"
                className="rounded-lg text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-auto"
              >
                Get Started
                <Rocket className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Link href="https://www.npmjs.com/package/bitswitch-sdk">
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg text-base font-medium border-border text-foreground hover:bg-muted/50 px-8 py-6 h-auto"
              >
                <Code2 className="mr-3 w-5 h-5" />
                SDK Documentation
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-background border-t border-border/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Everything You Need</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
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
      <section className="py-20 px-6 bg-muted/5 border-y border-border/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Simple Integration</h2>
            <p className="text-base font-medium text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-20 px-6 bg-background">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-8">Why Choose Flagship Feat</h2>
              <ul className="space-y-4">
                <BenefitItem text="Deploy features without fear of breaking production environments" />
                <BenefitItem text="Test new ideas with real users before committing to full rollout" />
                <BenefitItem text="Kill switches for immediate issue resolution" />
                <BenefitItem text="Granular control over feature visibility and user targeting" />
                <BenefitItem text="Real-time monitoring with alerting systems" />
                <BenefitItem text="Seamless integration with your existing development workflow" />
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Built for Scale</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm font-medium">
                    Enterprise-grade infrastructure that grows with your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold tracking-tight text-foreground text-lg">High Performance</h4>
                      <p className="text-muted-foreground text-sm">Lightning-fast flag evaluation with global edge network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold tracking-tight text-foreground text-lg">Developer Friendly</h4>
                      <p className="text-muted-foreground text-sm">Intuitive APIs and comprehensive documentation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/5 border-t border-border/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border-border bg-card/80 backdrop-blur shadow-sm p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Ready to Transform Your Deployments?</h2>
            <p className="text-lg font-medium text-muted-foreground mb-8 leading-relaxed">
              Join development teams who trust Flagship Feat to deliver better software, faster and safer.
            </p>
            <Link href="https://app.bitswitch.site/auth/signup">
              <Button
                size="lg"
                className="rounded-lg text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 h-auto"
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
