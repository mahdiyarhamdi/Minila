'use client'

import LandingNavbar from '@/components/landing/LandingNavbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorks from '@/components/landing/HowItWorks'
import CardsCarousel from '@/components/landing/CardsCarousel'
import CommunitiesCarousel from '@/components/landing/CommunitiesCarousel'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

/**
 * Landing Page - صفحه اصلی مینیلا
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <LandingNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Cards Carousel */}
      <CardsCarousel />

      {/* Communities Carousel */}
      <CommunitiesCarousel />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
