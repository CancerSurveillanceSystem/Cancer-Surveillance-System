import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


const Tutorial = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 flex flex-col space-y-24 pt-28">

      <Carousel>
        <CarouselContent>
          <CarouselItem className=''>
            <Section
              title="Landing Page"
              videoSrc="https://www.youtube.com/embed/DFuVRNVgI7A"
            />
          </CarouselItem>
          <CarouselItem>
            <Section
              title="Doctor Page"
              videoSrc="https://www.youtube.com/embed/2wXSqnkOJK8"
            />
          </CarouselItem>
          <CarouselItem>
            <Section
              title="Patient Page"
              videoSrc="https://www.youtube.com/embed/26uC4C0Xrgs"
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className='left-80 h-20 w-20 top-1/2 -translate-y-1/4 border-none' />
        <CarouselNext className='right-80 h-20 w-20 top-1/2 -translate-y-1/4 border-none' />
      </Carousel>

      {/* User Manual Section */}
      <div className="space-y-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800">User Manual</h2>
        <div className="max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src="/CSS_User_Manual_Parinas_Team.pdf"
            width="100%"
            height="800px"
            title="User Manual PDF"
            className="w-full"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

// Section Component for Reusability
const Section = ({ title, videoSrc }: { title: string; videoSrc: string }) => (
  <div className="space-y-8">
    <h2 className="text-4xl font-bold text-center text-gray-800">{title}</h2>
    <div className="flex justify-center items-center">
      <div className="max-w-5xl w-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <iframe
          width="100%"
          height="600"
          src={videoSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full"
        ></iframe>
      </div>
    </div>
  </div>
);

export default Tutorial;
