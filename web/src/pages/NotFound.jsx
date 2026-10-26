// 404 page: galat URL khole to ye dikhta hai.
import { PageTransition } from "../components/PageLayout"; // page animation wrapper
import { ButtonLink } from "../components/Button"; // button jaisa link

export default function NotFound() { // component shuru
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* sab kuch beech me */}
      <div className="flex flex-col items-center py-32 text-center">
        {/* chhota "404" */}
        <p className="text-sm font-medium text-violet-400">404</p>
        {/* mazedaar heading */}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">This page procrastinated itself out of existence</h1>
        {/* samjhaane wali line */}
        <p className="mt-3 text-zinc-400">The link may be broken, or the page never got around to being built.</p>
        {/* home pe wapas jaane ka button */}
        <ButtonLink to="/" className="mt-8">
          {/* button text */}
          Back home
          {/* ButtonLink band */}
        </ButtonLink>
        {/* center div band */}
      </div>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band
