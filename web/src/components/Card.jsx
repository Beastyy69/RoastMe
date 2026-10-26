// Card = rounded box, patli border aur soft shadow. Poori app me same look ke liye.
// as="form" doge to <form> ban jaata hai.
export default function Card({ as: Tag = "div", className = "", children, ...props }) { // Tag = kaunsa HTML element
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <Tag
      className={`rounded-2xl border border-white/[0.08] bg-surface shadow-[0_1px_0_0_rgb(255_255_255/0.04)_inset,0_20px_50px_-20px_rgb(0_0_0/0.6)] ${className}`} // rounded + border + shadow + extra classes
      {...props} // baaki props (onSubmit waghaira)
      // opening tag band
    >
      {/* card ke andar ka content */}
      {children}
      {/* card band */}
    </Tag>
  ); // JSX band
} // component band
