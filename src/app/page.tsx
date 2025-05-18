import React from 'react';
import Head from 'next/head';
import Footer from './components/Footer'
import RollingGallery from "./components/RollingGallery";
import Aurora from "./components/Aurora";
import TiltedCard from './components/TiltedCard';
import LottieComponent from './components/LottieComponent';
import ScrollAnimation from './components/ScrollAnimation';
import Image from 'next/image';

// Navigation Bar Component
function NavigationBar() {
  return (
    <nav className="bg-white p-2 text-black flex justify-between items-center rounded-full shadow-md m-6">
  <div className="relative w-[120px] h-[40px] m-4">
  <Image
    src="/logo.svg"
    alt="FanLink Logo"
    fill               // 讓圖片填滿父容器
    sizes="120px"      // 告訴瀏覽器實際顯示寬度
    className="object-contain"
  />
</div>


      <div className="flex gap-2">
        <button className="px-4 py-2 text-black rounded-md transition transform hover:scale-105 lightgray">
        Login
        </button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md transition transform hover:scale-105 hover:bg-blue-600">
          Register
        </button>
      </div>
    </nav>
  );
}


// Section One
function SectionOne() {
    return (
<section className="flex items-center p-6 max-[800px]:flex-col max-[800px]:w-full">
  <div className="absolute inset-0 -z-10">
    <Aurora
      colorStops={['#00d8ff', '#7cff67', '#00d8ff']}
      amplitude={1.0}
      blend={0.5}
      speed={1.0}
    />
  </div>

  <ScrollAnimation delay={0.1}>
    {/* === 這裡才是實際排版容器 === */}
    <div className="max-[800px]:w-full">
    <div className="flex items-center
                    max-[800px]:flex-col">

      <div className="w-1/2 max-[800px]:w-full">
        <h1 className="text-5xl font-black mb-2 max-[800px]:text-3xl">
          Your bias, hobby and collections in one page!
        </h1>
        <h2 className="text-2xl font-semibold !text-gray-600 mb-4 max-[800px]:text-xl">
          Join 50M+ people using our platform to introduce themselves! Share your interests and favorite things from your social media profiles.
        </h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded transition-transform hover:scale-110">
          Claim Yours
        </button>
      </div>


      <div className="w-1/2 flex justify-center max-[800px]:w-full">
        <TiltedCardComponent />
      </div>
    </div>
    </div>
  </ScrollAnimation>
</section>

    );
}

function TiltedCardComponent() {
  return (
    <TiltedCard
      imageSrc="/Landing_card.png"
      altText="My Awesome Card"
      captionText="Get to know me on FanLink"
    />
  );
}


// Section Two
function SectionTwo() {
    return (
        <ScrollAnimation delay={0.3}>
        <section className="flex p-6 items-center">

            <div className="w-1/2">
                <LottieComponent />
            </div>
            <div className="w-1/2">
                <h1 className="text-5xl font-black mb-2 max-[800px]:text-3xl">Create and Customize Your Social Universe</h1>
                <h2 className="text-2xl font-semibold !text-gray-600 mb-4 max-[800px]:text-xl">Bring together your Instagram, Threads, Facebook, Twitter, and LINE profiles on a single page. Seamlessly embed Spotify and YouTube to share your favorite content and connect with your community like never before.</h2>
                <button className="px-4 py-2 bg-green-500 text-white rounded transition transform hover:scale-110">Get Started</button>
            </div>

        </section>
        </ScrollAnimation>
    );
}

// Section Three: Carousel with Text
function SectionThree() {
  return (
    <ScrollAnimation delay={0.3}>
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
}


// Home Page Component
function HomePage() {
    return (
        <div>
            <Head>
                <title>FanLink - Discover Your Fandom</title>
                <meta name="description" content="Connect with your favorite fandoms." />
            </Head>
            <NavigationBar />
            <SectionOne />
            <SectionTwo />
            <SectionThree />
            <Footer />
        </div>
    );
}

export default HomePage;
