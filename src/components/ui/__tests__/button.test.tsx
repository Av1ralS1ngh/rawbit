import type { ComponentProps } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../button";

type ButtonProps = ComponentProps<typeof Button>;

const variantExpectation = {
  default: "bg-primary",
  destructive: "bg-destructive",
  outline: "border border-input",
  secondary: "bg-secondary",
  ghost: "hover:bg-accent",
  link: "underline-offset-4",
} as const satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

const sizeExpectation = {
  default: "h-9",
  sm: "h-8",
  lg: "h-10",
  icon: "h-9 w-9",
} as const satisfies Record<NonNullable<ButtonProps["size"]>, string>;

type VariantKey = keyof typeof variantExpectation;
type SizeKey = keyof typeof sizeExpectation;

describe("Button", () => {
  const variantCases = Object.keys(variantExpectation) as VariantKey[];
  const sizeCases = Object.keys(sizeExpectation) as SizeKey[];

  it.each(variantCases)(
    "applies %s variant classes",
    (variant) => {
      const { getByRole } = render(
        <Button variant={variant}>Test</Button>
      );
      expect(getByRole("button").className).toContain(
        variantExpectation[variant]
      );
    }
  );

  it.each(sizeCases)("applies %s size classes", (size) => {
    const { getByRole } = render(
      <Button size={size}>Size</Button>
    );
    expect(getByRole("button").className).toContain(sizeExpectation[size]);
  });

  it("supports rendering child components", () => {
    const { getByText } = render(
      <Button asChild>
        <a href="#example">Link</a>
      </Button>
    );

    const anchor = getByText("Link");
    expect(anchor.tagName).toBe("A");
    expect(anchor.className).toContain("inline-flex");
  });
});
