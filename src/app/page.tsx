import React from 'react';
import { useMemo } from 'react';
import Head from 'next/head';
import Footer from './components/Footer'
import RollingGallery from "./components/RollingGallery";
import Aurora from "./components/Aurora";
import TiltedCard from './components/TiltedCard';
import LottieComponent from './components/LottieComponent';
import ScrollAnimation from './components/ScrollAnimation';
import { ZoomParallax } from './components/ZoomParallex';
import Image from 'next/image';
import Button from './components/Button';
import Link from 'next/link';

// Navigation Bar Component
const NavigationBar = React.memo(() => {
  return (
    <nav className="bg-white p-2 text-black flex justify-between items-center rounded-full shadow-md m-6">
      <div className="relative w-[120px] h-[40px] m-4">
        <Image
          src="/logo.svg"
          alt="FanLink Logo"
          fill
          sizes="120px"
          className="object-contain"
        />
      </div>

      <div className="flex gap-2 mr-4">
        <Link href="/login">
          <Button variant="secondary" disabled={false}>
            Login
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="primary" disabled={false}>
            Register
          </Button>
        </Link>
      </div>
    </nav>
  );
});

NavigationBar.displayName = 'NavigationBar';


// Section One
const SectionOne = React.memo(() => {
  const auroraConfig = useMemo(() => ({
    colorStops: ['#00d8ff', '#7cff67', '#00d8ff'],
    amplitude: 1.0,
    blend: 0.5,
    speed: 1.0
  }), []);

  const scrollAnimationDelay = useMemo(() => 0.1, []);

  return (
    <section className="flex items-center p-6 max-[800px]:flex-col max-[800px]:w-full">
      <div className="absolute inset-0 -z-10">
        <Aurora {...auroraConfig} />
      </div>

      <ScrollAnimation delay={scrollAnimationDelay}>
        <div className="max-[800px]:w-full">
          <div className="flex items-center max-[800px]:flex-col">
            <div className="w-1/2 max-[800px]:w-full">
              <h1 className="text-5xl text-black font-black mb-2 max-[800px]:text-3xl">
                Your bias, hobby and collections in one page!
              </h1>
              <h2 className="text-2xl font-semibold !text-gray-600 mb-4 max-[800px]:text-xl">
                Join 50M+ people using our platform to introduce themselves! Share your interests and favorite things from your social media profiles.
              </h2>
              <Link href="/login">
                <button className="px-4 py-2 bg-primary text-white rounded transition-transform hover:scale-110">
                  Claim Yours
                </button>
              </Link>
            </div>

            <div className="w-1/2 flex justify-center max-[800px]:w-full">
              <TiltedCardComponent />
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
});

SectionOne.displayName = 'SectionOne';

const TiltedCardComponent = React.memo(() => {
  const tiltedCardProps = useMemo(() => ({
    imageSrc: "/Landing_card.png",
    altText: "My Awesome Card",
    captionText: "Get to know me on FanLink",
    showMobileWarning: false,
  }), []);

  return <TiltedCard {...tiltedCardProps} />;
});

TiltedCardComponent.displayName = 'TiltedCardComponent';


// Section Two
const SectionTwo = React.memo(() => {
  const scrollAnimationDelay = useMemo(() => 0.3, []);

  return (
    <ScrollAnimation delay={scrollAnimationDelay}>
      <section className="flex p-6 items-center">
        <div className="w-1/2">
          <LottieComponent />
        </div>
        <div className="w-1/2">
          <h1 className="text-5xl font-black mb-2 max-[800px]:text-3xl">
            Create and Customize Your Social Universe
          </h1>
          <h2 className="text-2xl font-semibold !text-gray-600 mb-4 max-[800px]:text-xl">
            Bring together your Instagram, Threads, Facebook, Twitter, and LINE profiles on a single page. Seamlessly embed Spotify and YouTube to share your favorite content and connect with your community like never before.
          </h2>
          <Link href="/login">
            <button className="px-4 py-2 bg-primary text-white rounded transition transform hover:scale-110">
              Get Started
            </button>
          </Link>
        </div>
      </section>
    </ScrollAnimation>
  );
});

SectionTwo.displayName = 'SectionTwo';

// Section Three: Carousel with Text
const SectionThree = React.memo(() => {
  const scrollAnimationDelay = useMemo(() => 0.3, []);

  return (
    <ScrollAnimation delay={scrollAnimationDelay}>
      <section className="flex flex-col items-center justify-center p-6 bg-black-200">
        <h1 className="text-5xl font-black mb-2 flex justify-center max-[800px]:text-3xl">
          One Hub for All Your Passions
        </h1>

        <h2 className="text-2xl font-semibold !text-gray-600 mb-4 max-[800px]:text-xl">
          A dynamic social platform to connect, share, and explore your hobbies. Whether it&apos;s art,
          music, gaming, or fitness, manage your interests and build your community.
        </h2>

        <div className="carousel w-full h-full bg-black-300">
          <RollingGallery />
        </div>
      </section>
    </ScrollAnimation>
  );
});

SectionThree.displayName = 'SectionThree';


// Home Page Component
function HomePage() {

  // head 使用 useMemo
  const pageMetadata = useMemo(() => ({
    title: "FanLink - Discover Your Fandom",
    description: "Connect with your favorite fandoms."
  }), []);

  // ZoomParallax 使用 useMemo
  const zoomParallaxConfig = useMemo(() => ({
    iconSrc: "/ObjektTitle.svg",
    backgroundSrc: "/objekt2.png",
    iconAlt: "Icon",
    iconSize: 700,
    height: 700
  }), []);

  // 靜態內容使用 useMemo
  const staticSections = useMemo(() => (
    <>
      <SectionOne />
      <SectionTwo />
      <SectionThree />
    </>
  ), []);
    return (
        <div>
          <Head>
            <title>{pageMetadata.title}</title>
            <meta name="description" content={pageMetadata.description} />
          </Head>
            <NavigationBar />
            {staticSections}
            <ZoomParallax {...zoomParallaxConfig} />
            <Footer />
        </div>
    );
}

export default HomePage;
