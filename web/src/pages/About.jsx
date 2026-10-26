// About page: app ke values (funny not mean, kam data, honest tech) + CTA.
import { Heart, Lock, Smile } from "lucide-react"; // icons
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import { ButtonLink } from "../components/Button"; // button link
import Card from "../components/Card"; // card box

// Teen value cards
const VALUES = [ // { icon, title, text }
  { // card 1
    icon: Smile, // smiley icon
    title: "Funny, not mean", // title
    text: "Roasts poke at habits, routines and excuses. Never appearance, identity, health or anything you can't change.", // text
  }, // card 1 band
  { // card 2
    icon: Lock, // taala icon
    title: "Minimal data", // title
    text: "No accounts. History is linked to a random id in your browser and stores only the finished result.", // text
  }, // card 2 band
  { // card 3
    icon: Heart, // dil icon
    title: "Honest about the tech", // title
    text: "Scores are labelled as entertainment. The ML model's predictions and confidence are shown as they are.", // text
  }, // card 3 band
]; // list band

export default function About() { // component shuru
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* page ka heading section */}
      <PageHeader
        eyebrow="About" // chhota label
        title="A comedy app that takes itself just seriously enough" // bada title
        description="RoastMe AI is a portfolio-grade demo of a full-stack product: a React website, a native Android app built with Expo, and a FastAPI backend with a small scikit-learn model, all sharing one API." // description
      // self-closing tag yahin band
      />
      {/* 3 value cards ka grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* har value ka ek card */}
        {VALUES.map(({ icon: Icon, title, text }) => (
          // card
          <Card key={title} className="p-6">
            {/* icon */}
            <Icon className="size-5 text-violet-400" />
            {/* title */}
            <h2 className="mt-4 font-semibold text-white">{title}</h2>
            {/* text */}
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
            {/* Card band */}
          </Card>
          // map band
        ))}
        {/* grid band */}
      </div>
      {/* neeche ka CTA card */}
      <Card className="mt-6 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
        {/* text wala hissa */}
        <div>
          {/* heading */}
          <h2 className="text-xl font-semibold text-white">Ready to be humbled?</h2>
          {/* chhoti line */}
          <p className="mt-1 text-sm text-zinc-400">It takes about 30 seconds and a little self-awareness.</p>
          {/* text band */}
        </div>
        {/* Roast page ka button */}
        <ButtonLink to="/roast">Roast Me Now</ButtonLink>
        {/* CTA card band */}
      </Card>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band
