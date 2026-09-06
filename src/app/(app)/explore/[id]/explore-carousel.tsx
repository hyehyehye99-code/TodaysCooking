"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IngredientChipState } from "@/lib/actions/recipes";
import type { MealPlanCardRecipe } from "./meal-plan-card-image";
import { MealPlanPanel } from "./meal-plan-panel";

export type CarouselPlan = {
  id: string;
  title: string;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
  recipes: {
    id: string;
    title: string | null;
    displayName: string | null;
    coverPhotoUrl?: string;
    iconEmoji: string | null;
    linkThumbnailUrl?: string | null;
    ingredients: { name: string; amount: string | null; initialState: IngredientChipState }[];
  }[];
};

export function ExploreCarousel({
  initialPlanId,
  householdName,
  plans,
  untitledLabel,
}: {
  initialPlanId: string;
  householdName: string;
  plans: CarouselPlan[];
  untitledLabel: string;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [currentId, setCurrentId] = useState(initialPlanId);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scrollToPlan(id: string, behavior: ScrollBehavior = "smooth") {
    panelRefs.current.get(id)?.scrollIntoView({ behavior, inline: "start", block: "nearest" });
  }

  // Land on the requested plan without an animated scroll on first paint.
  useEffect(() => {
    scrollToPlan(initialPlanId, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let closestId = currentId;
      let closestDist = Infinity;
      for (const [id, el] of panelRefs.current) {
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      }
      if (closestId !== currentId) {
        setCurrentId(closestId);
        router.replace(`/explore/${closestId}`, { scroll: false });
      }
    }, 120);
  }

  return (
    <div className="relative -mx-5">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            ref={(el) => {
              if (el) panelRefs.current.set(plan.id, el);
              else panelRefs.current.delete(plan.id);
            }}
            className="w-full shrink-0 snap-start px-5"
          >
            <MealPlanPanel
              mealPlanId={plan.id}
              householdName={householdName}
              title={plan.title}
              eventDate={plan.eventDate}
              headcount={plan.headcount}
              cardRecipes={plan.cardRecipes}
              recipes={plan.recipes}
              untitledLabel={untitledLabel}
              onPrev={() => scrollToPlan(plans[i - 1]?.id)}
              onNext={() => scrollToPlan(plans[i + 1]?.id)}
              hasPrev={i > 0}
              hasNext={i < plans.length - 1}
            />
          </div>
        ))}
      </div>

      {plans.length > 1 && (
        <div className="mt-1 flex justify-center gap-1.5">
          {plans.map((plan) => (
            <span
              key={plan.id}
              className={`h-1.5 rounded-full transition-all ${
                plan.id === currentId ? "w-4 bg-accent" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
