import { ArticleH2, ArticleP, SeoArticle } from '@/src/components/web/SeoArticle';
import React from 'react';

export default function FocusTimerAdhdPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do timers help with ADHD focus?',
        acceptedAnswer: { '@type': 'Answer', text: 'Many people with ADHD find external timers helpful because they make time visible and turn open-ended tasks into short, concrete commitments. A draining hourglass adds a calm visual cue.' },
      },
      {
        '@type': 'Question',
        name: 'What timer length is best for ADHD?',
        acceptedAnswer: { '@type': 'Answer', text: 'Start small. Even a 10–15 minute focus block can be easier to begin than 25. Flowglass lets you set a custom work and break length so you can find what fits.' },
      },
    ],
  };

  return (
    <SeoArticle
      path="/focus-timer-adhd"
      title="Focus Timer for ADHD — Free, Visual & Simple | Flowglass"
      description="A free, low-distraction, ADHD-friendly focus timer. Make time visible, start with short blocks, and customize your work and break lengths."
      h1="Focus Timer for ADHD"
      intro="Make time visible and tasks easier to start. Press start below, or set a shorter custom block that feels achievable today."
      timerMinutes={15}
      jsonLd={jsonLd}
      related={[
        { href: '/pomodoro-timer', label: 'Free Pomodoro Timer' },
        { href: '/deep-work-timer', label: 'Deep Work Timer' },
      ]}
    >
      <ArticleH2>Why a visible timer can help</ArticleH2>
      <ArticleP>
        For many people with ADHD, time feels abstract — it is either “now” or “not now.” A visible countdown turns that fog into
        something concrete. When the task is “focus until the hourglass empties,” starting is far less daunting than facing an
        open-ended afternoon of work. The timer also externalizes the decision to keep going, so you are not relying on willpower alone.
      </ArticleP>
      <ArticleP>
        Flowglass keeps the screen calm on purpose. There is no aggressive ticking and no clutter — just a draining hourglass, the
        time remaining, and a single start button. Finishing a block earns XP and a short celebration; if motion is distracting,
        switch on Reduce motion in Settings and it all stays still.
      </ArticleP>

      <ArticleH2>Start small and adjust</ArticleH2>
      <ArticleP>
        Twenty-five minutes can feel like a wall on a hard day. With the Custom technique you can set any work and break length —
        try a 10 or 15 minute block to get moving. Momentum matters more than length: once you have started, continuing is often easier.
        You can always run another short block, and another, until the work is done.
      </ArticleP>
      <ArticleP>
        Save your favorite setup as a preset so it is one tap away next time. Flowglass remembers it, along with the time you have
        focused, so good days are visible and repeatable.
      </ArticleP>

      <ArticleH2>Breaks and small habits</ArticleH2>
      <ArticleP>
        Pair the timer with a clear, single task and a tidy space. Use breaks to stand and move rather than switch to your phone,
        which can quietly eat the rest of your afternoon. The timer is free and needs no login, so it is always within reach. Begin
        with the short block above whenever you are ready.
      </ArticleP>
      <ArticleP>
        Flowglass is a productivity tool, not a treatment, and this page is general information rather than medical advice. If ADHD
        affects your daily life, a qualified professional can help you find what works for you.
      </ArticleP>
    </SeoArticle>
  );
}
