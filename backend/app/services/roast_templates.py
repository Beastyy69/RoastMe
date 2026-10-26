"""Hath se likhi comedy lines. AI band ho ya fail ho, tab yahi use hoti hain.

Placeholders: {name} = nickname, {quote} = user ki likhi line ka chhota hissa.
Lines jaan-boojh ke looks, pehchaan (religion, gender...) jaise topics se door hain.
Naye jokes add karne ho to yahi file edit karo.
"""

# Roast ki pehli line (intensity ke hisaab se)
OPENERS = {  # Roast ki pehli line wala dict shuru
    "friendly": [  # friendly wale openers
        "Okay {name}, I read your bio and I have some gentle notes.",  # friendly opener 1
        "{name}, I say this with love and a tiny bit of concern.",  # friendly opener 2
        "Alright {name}, let's do a soft-launch roast.",  # friendly opener 3
    ],  # friendly list band
    "savage": [  # savage wale openers
        "{name}, I read your bio so you don't have to. You're welcome, everyone.",  # savage opener 1
        "Sit down, {name}. This won't take long, unlike your to-do list.",  # savage opener 2
        "{name}, your life choices called. They want a manager.",  # savage opener 3
    ],  # savage list band
    "extra_spicy": [  # extra spicy wale openers
        "{name}, I've seen loading screens with more direction than you.",  # extra spicy opener 1
        "Brace yourself, {name}. Your bio just filed a complaint against you.",  # extra spicy opener 2
        "{name}, I'd roast you gently, but your routine already did the damage.",  # extra spicy opener 3
    ],  # extra spicy list band
}  # dict band

# User ki apni line quote karke mazaak
QUOTE_LINES = {  # User ki line quote karne wala dict shuru
    "friendly": [  # friendly wale quote lines
        "You wrote \"{quote}\" like it was a fun fact. It's a cry for help, but a cute one.",  # friendly quote line 1
        "\"{quote}\" is adorable. Wrong, but adorable.",  # friendly quote line 2
    ],  # friendly list band
    "savage": [  # savage wale quote lines
        "You typed \"{quote}\" with your own hands and still pressed submit.",  # savage quote line 1
        "\"{quote}\". Imagine writing that and thinking it helps your case.",  # savage quote line 2
    ],  # savage list band
    "extra_spicy": [  # extra spicy wale quote lines
        "\"{quote}\" isn't a habit, it's a plot twist in a documentary about bad decisions.",  # extra spicy quote line 1
        "You said \"{quote}\" like it's a personality. It's a warning label.",  # extra spicy quote line 2
    ],  # extra spicy list band
}  # dict band

# Har category × intensity ke jokes (2 random chune jaate hain)
CATEGORY_LINES = {  # Category → intensity → jokes wala dict shuru
    "procrastination": {  # procrastination category ke jokes
        "friendly": [  # procrastination + friendly wale jokes
            "Your deadlines aren't deadlines, they're suggestions you ghost politely.",  # procrastination, friendly joke 1
            "You don't procrastinate, you just believe deeply in future you.",  # procrastination, friendly joke 2
            "Your to-do list has seen more seasons than most TV shows.",  # procrastination, friendly joke 3
        ],  # friendly list band
        "savage": [  # procrastination + savage wale jokes
            "Future you is going to need a lawyer for everything present you keeps assigning them.",  # procrastination, savage joke 1
            "You don't work well under pressure. You just only work under pressure.",  # procrastination, savage joke 2
            "Your browser has more open tabs than you have finished tasks.",  # procrastination, savage joke 3
        ],  # savage list band
        "extra_spicy": [  # procrastination + extra spicy wale jokes
            "You'd postpone your own surprise party if someone gave you a deadline for it.",  # procrastination, extra spicy joke 1
            "Your motivation arrives like a delivery driver: two hours late, then leaves it at the wrong door.",  # procrastination, extra spicy joke 2
            "Even your alarm has given up and started snoozing itself.",  # procrastination, extra spicy joke 3
        ],  # extra spicy list band
    },  # procrastination category band
    "student_life": {  # student life category ke jokes
        "friendly": [  # student life + friendly wale jokes
            "Your study plan is ambitious. Your study execution is fan fiction.",  # student life, friendly joke 1
            "You highlight so much of the textbook it now qualifies as a coloring book.",  # student life, friendly joke 2
            "Your best subject is still \"asking for an extension\".",  # student life, friendly joke 3
        ],  # friendly list band
        "savage": [  # student life + savage wale jokes
            "You treat the syllabus like terms and conditions: scroll, ignore, accept.",  # student life, savage joke 1
            "Your GPA is being carried harder than a group project's quiet kid.",  # student life, savage joke 2
            "You attend class the way Wi-Fi works in the library: technically present, practically gone.",  # student life, savage joke 3
        ],  # savage list band
        "extra_spicy": [  # student life + extra spicy wale jokes
            "Your exam prep is one motivational video and a prayer with no follow-up.",  # student life, extra spicy joke 1
            "You've spent more on textbooks you never opened than on decisions you thought through.",  # student life, extra spicy joke 2
            "Your attendance record looks like a ghost wrote it.",  # student life, extra spicy joke 3
        ],  # extra spicy list band
    },  # student life category band
    "gaming": {  # gaming category ke jokes
        "friendly": [  # gaming + friendly wale jokes
            "Your K/D ratio is great. Your sleep-to-awake ratio, less so.",  # gaming, friendly joke 1
            "\"One more match\" is the longest lie in your vocabulary.",  # gaming, friendly joke 2
            "You respawn faster than you reply to texts.",  # gaming, friendly joke 3
        ],  # friendly list band
        "savage": [  # gaming + savage wale jokes
            "You blame lag so often your router is considering therapy.",  # gaming, savage joke 1
            "Your backlog has more unplayed games than your life has finished chapters.",  # gaming, savage joke 2
            "You grind a battle pass harder than you've ever grinded anything with a paycheck.",  # gaming, savage joke 3
        ],  # savage list band
        "extra_spicy": [  # gaming + extra spicy wale jokes
            "Your rank is stuck in the same place as your life: the waiting lobby.",  # gaming, extra spicy joke 1
            "Your RGB setup has more personality than your weekend plans.",  # gaming, extra spicy joke 2
            "You'd rage quit a tutorial if it asked you to do laundry.",  # gaming, extra spicy joke 3
        ],  # extra spicy list band
    },  # gaming category band
    "productivity": {  # productivity category ke jokes
        "friendly": [  # productivity + friendly wale jokes
            "You've organized your tasks so beautifully it's almost a shame to do them. So you don't.",  # productivity, friendly joke 1
            "You have a productivity app for everything except actually being productive.",  # productivity, friendly joke 2
            "Your calendar is color-coded. Your progress is mostly beige.",  # productivity, friendly joke 3
        ],  # friendly list band
        "savage": [  # productivity + savage wale jokes
            "You spend so long optimizing your workflow that the work quits first.",  # productivity, savage joke 1
            "Your morning routine has more steps than your actual job.",  # productivity, savage joke 2
            "You read books about habits the way people read menus at restaurants they can't afford.",  # productivity, savage joke 3
        ],  # savage list band
        "extra_spicy": [  # productivity + extra spicy wale jokes
            "You made a Notion template for your life and still forgot to live it.",  # productivity, extra spicy joke 1
            "Your to-do list has a to-do list, and both are behind schedule.",  # productivity, extra spicy joke 2
            "You track your focus score more closely than you track your focus.",  # productivity, extra spicy joke 3
        ],  # extra spicy list band
    },  # productivity category band
    "general": {  # general category ke jokes
        "friendly": [  # general + friendly wale jokes
            "You're like a software update: everyone knows you're coming, nobody knows what changed.",  # general, friendly joke 1
            "You have main-character energy in a show that keeps getting renewed for some reason.",  # general, friendly joke 2
            "Honestly, you're doing fine. Mostly. In some areas. Probably.",  # general, friendly joke 3
        ],  # friendly list band
        "savage": [  # general + savage wale jokes
            "Your life has the energy of a group chat nobody muted but nobody reads.",  # general, savage joke 1
            "You're the human version of a terms-and-conditions page: long, confusing, and skipped.",  # general, savage joke 2
            "You give off strong \"I'll figure it out later\" energy, and later never shows up.",  # general, savage joke 3
        ],  # savage list band
        "extra_spicy": [  # general + extra spicy wale jokes
            "If your life were a movie, the audience would be checking their phones by minute ten.",  # general, extra spicy joke 1
            "You're living proof that confidence and a plan are two separate purchases.",  # general, extra spicy joke 2
            "Your autobiography would be titled \"It Seemed Like a Good Idea\".",  # general, extra spicy joke 3
        ],  # extra spicy list band
    },  # general category band
}  # dict band

# Aakhri line
CLOSERS = {  # Aakhri line wala dict shuru
    "friendly": [  # friendly wale closers
        "Still, we love you. Drink some water and finish one thing today.",  # friendly closer 1
        "You're a work in progress. Emphasis on the progress. Eventually.",  # friendly closer 2
    ],  # friendly list band
    "savage": [  # savage wale closers
        "No notes. Actually, many notes, but you'd postpone reading them.",  # savage closer 1
        "Respectfully, get it together. Disrespectfully, also get it together.",  # savage closer 2
    ],  # savage list band
    "extra_spicy": [  # extra spicy wale closers
        "This roast took two seconds. Fixing your routine will take two business years.",  # extra spicy closer 1
        "I'd say \"do better\", but you'd schedule that for next Monday.",  # extra spicy closer 2
    ],  # extra spicy list band
}  # dict band
