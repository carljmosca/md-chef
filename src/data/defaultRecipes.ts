import { Recipe } from '../types/recipe';
import { extractFrontmatter, parseRecipeBody } from '../services/markdownParser';

interface SeedRecipe {
  path: string;
  sha: string;
  content: string;
}

const SEED_DATA: SeedRecipe[] = [
  {
    path: "Italian/chicken-marsala.md",
    sha: "d833435409b9c1ae582fe0b2545c148d3ab89835",
    content: `---
title: Chicken Marsala
prep_time: 15 mins
cook_time: 20 mins
servings: 4
difficulty: Easy
tags:
  - italian
  - chicken
  - dinner
credit: Carl Mosca
---

## Ingredients

- [ ] 2 boneless skinless chicken breasts
- [ ] 16 ounces of cremini mushrooms, sliced
- [ ] 6 tablespoons unsalted butter, divided
- [ ] 1/4 cup sweet Marsala wine
- [ ] 1/2 cup dry white wine
- [ ] 1 cup low-sodium chicken stock
- [ ] 2 cloves garlic, minced
- [ ] 1/2 cup all-purpose flour for dredging
- [ ] 2 tablespoons olive oil
- [ ] Kosher salt and freshly ground black pepper to taste
- [ ] 2 tablespoons fresh chopped parsley

## Instructions

1. [ ] Split each chicken breast horizontally through the middle to make 4 cutlets. Place plastic wrap over them and pound each one flat using a meat tenderizer until they are about a quarter inch thick.
2. [ ] Season a generous amount of salt and pepper on both sides of each piece. Place flour on a shallow plate and dredge each cutlet, shaking off excess.
3. [ ] Heat 2 tablespoons olive oil and 2 tablespoons butter in a large skillet over medium-high heat until hot. Cook cutlets for 3 to 4 minutes per side until golden brown and cooked through. Transfer chicken to a warm platter.
4. [ ] In the same skillet, add 2 tablespoons butter and sliced mushrooms. Sauté for 6-8 minutes until golden browned and tender. Add minced garlic and cook for 1 minute until fragrant.
5. [ ] Pour in Marsala wine and white wine, scraping up the browned fond from the bottom of the skillet. Bring to a vigorous simmer and reduce by half, about 3-5 minutes.
6. [ ] Pour in chicken stock and simmer for 5 minutes until sauce slightly thickens. Stir in remaining 2 tablespoons cold butter to create a glossy glaze.
7. [ ] Return cooked chicken to the skillet, spooning the mushroom Marsala sauce over top. Simmer for 2 minutes to reheat through. Garnish with chopped parsley and serve hot.
`
  },
  {
    path: "Beef/beef-weilington.mcmd",
    sha: "207e93b92eebeac615f4d5730990e7608ed72a62",
    content: `---
title: Beef Wellington
prep_time: 1 hour
cook_time: 60 - 80 minutes
servings: 8
difficulty: Hard
tags:
  - beef
  - dinner
  - holiday
  - classic
source: https://www.thekitchn.com/beef-wellington-recipe-23280651
credit: The Kitchn
---

## Ingredients

- [ ] 1 (about 16-ounce) package frozen puff pastry, thawed in refrigerator
- [ ] 2 medium shallots, coarsely chopped
- [ ] 2 cloves garlic, coarsely chopped
- [ ] 2 teaspoons fresh thyme leaves
- [ ] 1 pound cremini mushrooms, trimmed and chopped fine
- [ ] 1 (about 2 1/2-pound) center-cut beef tenderloin roast
- [ ] 2 1/4 teaspoons kosher salt, divided
- [ ] 1/2 teaspoon freshly ground black pepper
- [ ] 2 tablespoons vegetable oil
- [ ] 2 tablespoons unsalted butter
- [ ] 6 to 8 cold slices prosciutto (about 5 ounces)
- [ ] 2 tablespoons Dijon mustard
- [ ] 1 large egg, beaten with 1 tsp water for egg wash
- [ ] Flaky sea salt for finishing

## Instructions

1. [ ] Pulse mushrooms, shallots, garlic, and thyme in a food processor until very finely chopped duxelles.
2. [ ] Trim beef tenderloin roast of surface silver skin. Tie kitchen twine around roast at 1 1/2-inch intervals for even thickness. Season all over with 2 teaspoons kosher salt and black pepper.
3. [ ] Heat 2 tablespoons vegetable oil in a large skillet over high heat. Sear roast on all sides until deeply browned, about 8 minutes total. Transfer to plate, remove twine, brush all over with Dijon mustard, and let chill in refrigerator.
4. [ ] In the same skillet over medium heat, melt 2 tablespoons butter. Add mushroom duxelles with 1/4 teaspoon salt and cook for 10-15 minutes until all moisture evaporates and mixture is dry and paste-like. Let cool completely.
5. [ ] Lay a sheet of plastic wrap on counter. Shingle prosciutto slices into a rectangle large enough to wrap the roast. Spread mushroom duxelles evenly over prosciutto.
6. [ ] Place chilled beef tenderloin in center and roll prosciutto tightly around the beef using the plastic wrap. Twist ends tight and chill in fridge for 30 minutes to firm up.
7. [ ] Roll puff pastry onto a lightly floured surface into a 12x14-inch rectangle. Unwrap chilled beef roll and place in center of pastry. Brush pastry edges with egg wash and fold pastry over the beef to seal tightly, trimming any excess.
8. [ ] Wrap tightly in plastic wrap and chill for at least 30 minutes (or up to 24 hours).
9. [ ] Preheat oven to 425°F (220°C). Transfer Wellington to parchment-lined baking sheet, seam-side down. Brush top and sides with egg wash. Score pastry decorative lattice patterns with tip of a sharp knife. Sprinkle with flaky sea salt.
10. [ ] Bake for 40 to 45 minutes until pastry is deep golden brown and meat thermometer reads 125°F for medium-rare.
11. [ ] Rest on cutting board for 15 minutes before slicing into thick medallions with a serrated knife.
`
  },
  {
    path: "Italian/margherita-pizza.md",
    sha: "6b90e418af9de6ad633e5010b070b14e86f57bd5",
    content: `---
title: Homemade Margherita Pizza
prep_time: 90 mins
cook_time: 12 mins
servings: 4
difficulty: Medium
tags:
  - italian
  - pizza
  - dinner
  - vegetarian
credit: Traditional Italian Recipe
---

## Ingredients

### For the Dough
- [ ] 3 1/2 cups all-purpose flour (or Tipo 00)
- [ ] 1 packet (2 1/4 tsp) active dry yeast
- [ ] 2 tablespoons extra virgin olive oil
- [ ] 2 teaspoons kosher salt
- [ ] 1 teaspoon sugar
- [ ] 1 1/4 cups warm water (110°F)

### For the Topping
- [ ] 1 can (14 oz) San Marzano crushed tomatoes
- [ ] 8 oz fresh mozzarella cheese, sliced or torn
- [ ] 12 fresh basil leaves
- [ ] 2 cloves garlic, finely minced
- [ ] 2 tablespoons extra virgin olive oil
- [ ] Sea salt and freshly cracked black pepper

## Instructions

### Prepare the Dough
1. [ ] In a small bowl, dissolve active dry yeast and sugar in 1 1/4 cups warm water. Let stand for 5 minutes until foamy.
2. [ ] In a large mixing bowl, whisk together flour and salt. Form a well in center, add yeast mixture and olive oil.
3. [ ] Mix until a cohesive dough forms. Turn onto floured board and knead vigorously for 8-10 minutes until supple, smooth, and elastic.
4. [ ] Place dough into a lightly oiled bowl, cover with a damp cloth, and let rise at room temperature for 60 to 90 minutes until doubled in bulk.
5. [ ] Punch dough down, divide into 2 equal balls, and let rest covered for 15 minutes.

### Assemble and Bake
6. [ ] Preheat oven with a baking steel or pizza stone to maximum temperature (500°F - 550°F / 260°C - 290°C) for 45 minutes.
7. [ ] Stretch dough on a piece of parchment paper or cornmeal-dusted pizza peel into a 12-inch round with slightly raised edges.
8. [ ] Spoon 1/2 cup crushed San Marzano tomatoes evenly across dough, leaving a 1/2-inch border. Scatter minced garlic, salt, and pepper.
9. [ ] Arrange fresh mozzarella slices across sauce. Drizzle with 1 tablespoon olive oil.
10. [ ] Slide onto screaming hot baking stone and bake for 8 to 12 minutes until crust is blistered and cheese is bubbling and melted.
11. [ ] Remove from oven, immediately scatter fresh basil leaves, slice into wedges, and serve hot.
`
  },
  {
    path: "Thai/pad-thai.md",
    sha: "50f71932d2364ecd2eb4b6c6e3357bfc79907f6e",
    content: `---
title: Authentic Pad Thai
prep_time: 20 mins
cook_time: 15 mins
servings: 4
difficulty: Medium
tags:
  - thai
  - noodles
  - stir-fry
---

## Ingredients

### Pad Thai Sauce
- [ ] 3 tablespoons tamarind paste
- [ ] 3 tablespoons fish sauce
- [ ] 3 tablespoons palm sugar (or brown sugar)
- [ ] 1 tablespoon rice vinegar
- [ ] 1/2 teaspoon chili powder or sriracha

### Stir-Fry
- [ ] 8 oz flat rice noodles (Pad Thai noodles)
- [ ] 1/2 lb shrimp, peeled and deveined (or chicken sliced thin)
- [ ] 2 large eggs, lightly beaten
- [ ] 1 cup firm tofu, pressed and cut into small cubes
- [ ] 3 cloves garlic, minced
- [ ] 2 shallots, thinly sliced
- [ ] 2 cups fresh bean sprouts
- [ ] 4 green onions (scallions), cut into 2-inch batons
- [ ] 1/3 cup roasted unsalted peanuts, crushed
- [ ] 3 tablespoons vegetable oil
- [ ] Lime wedges for serving

## Instructions

1. [ ] Soak rice noodles in warm water for 25 to 30 minutes until pliable and limp but still firm to bite. Drain thoroughly.
2. [ ] In a small saucepan over low heat, combine tamarind paste, fish sauce, palm sugar, rice vinegar, and chili powder. Stir for 3 minutes until sugar is fully dissolved. Set aside.
3. [ ] Heat 2 tablespoons oil in a large wok or skillet over high heat. Add shrimp and cook for 2 to 3 minutes until pink; remove to a plate.
4. [ ] Add remaining tablespoon oil, then add shallots, garlic, and cubed tofu. Stir-fry for 2 minutes until garlic is fragrant and tofu edges are golden.
5. [ ] Push ingredients to one side of wok, pour beaten eggs into the empty side, and scramble softly for 1 minute until just set.
6. [ ] Add drained noodles and prepared Pad Thai sauce to wok. Toss noodles vigorously for 3 to 4 minutes until they absorb sauce and turn tender.
7. [ ] Fold in cooked shrimp, half the bean sprouts, and sliced green onions. Cook for 1 minute until scallions wilt.
8. [ ] Plate onto warm serving bowls. Top with crushed peanuts, remaining fresh bean sprouts, and fresh lime wedges.
`
  },
  {
    path: "Greek/greek-shrimp-and-pasta.md",
    sha: "088748ab1b85f4f78a968facf2c825d86b1f652d",
    content: `---
title: Greek Shrimp and Pasta
prep_time: 10 mins
cook_time: 15 mins
servings: 4
difficulty: Easy
tags:
  - greek
  - seafood
  - pasta
  - quick
credit: Carl Mosca
---

## Ingredients

- [ ] 1 pound large shrimp, peeled and deveined
- [ ] 12 oz penne or fettuccine pasta
- [ ] 1/4 cup extra virgin olive oil
- [ ] 4 cloves garlic, minced
- [ ] 1 can (14.5 oz) diced fire-roasted tomatoes with juices
- [ ] 1/2 cup dry white wine
- [ ] 1 cup crumbled Greek feta cheese
- [ ] 1/4 cup chopped fresh dill or flat-leaf parsley
- [ ] 1 teaspoon dried oregano
- [ ] 1/4 teaspoon crushed red pepper flakes
- [ ] Salt and freshly ground black pepper to taste

## Instructions

1. [ ] Bring a large pot of salted water to boil. Cook pasta according to package directions until al dente, about 9-11 minutes. Drain and reserve 1/2 cup pasta cooking water.
2. [ ] While pasta cooks, heat olive oil in a wide heavy skillet over medium-high heat.
3. [ ] Add minced garlic and red pepper flakes; sauté for 30 seconds until fragrant without browning.
4. [ ] Add peeled shrimp to skillet in a single layer. Season with salt and pepper. Cook for 2 minutes per side until pink and opaque; transfer shrimp to a side plate.
5. [ ] Pour white wine into skillet, scraping bottom, and cook for 2 minutes until alcohol evaporates.
6. [ ] Stir in diced tomatoes with juice and dried oregano. Simmer gently for 5 minutes until tomato sauce thickens slightly.
7. [ ] Return cooked shrimp to skillet, along with cooked drained pasta and 1/4 cup reserved pasta water. Toss gently over medium heat for 2 minutes until pasta is coated with sauce.
8. [ ] Remove from heat. Scatter crumbled feta cheese and fresh chopped dill over pasta. Let sit for 1 minute so feta softens slightly, then serve immediately.
`
  },
  {
    path: "Asian/chicken-lettuce-wraps.md",
    sha: "5df81ff79e231f64c2baa7bd4df5e3035b05e64a",
    content: `---
title: Asian Chicken Lettuce Wraps
prep_time: 15 mins
cook_time: 15 mins
servings: 4
difficulty: Easy
tags:
  - asian
  - chicken
  - appetizers
  - low-carb
---

## Ingredients

- [ ] 1 pound ground chicken (or finely diced chicken thighs)
- [ ] 1 tablespoon sesame oil
- [ ] 1 medium onion, finely diced
- [ ] 2 cloves garlic, minced
- [ ] 1 tablespoon fresh ginger, grated
- [ ] 1 can (8 oz) water chestnuts, drained and finely chopped
- [ ] 3 tablespoons hoisin sauce
- [ ] 2 tablespoons reduced-sodium soy sauce
- [ ] 1 tablespoon rice vinegar
- [ ] 1 tablespoon sriracha (optional)
- [ ] 4 green onions, thinly sliced
- [ ] 1 head butterhead or iceberg lettuce, leaves separated and washed

## Instructions

1. [ ] Heat sesame oil in a large skillet or wok over medium-high heat.
2. [ ] Add ground chicken and cook for 6 to 8 minutes, breaking up with a wooden spoon until browned and fully cooked through.
3. [ ] Add diced onion, minced garlic, and grated ginger. Sauté for 3 minutes until onions soften and become translucent.
4. [ ] In a small bowl, whisk together hoisin sauce, soy sauce, rice vinegar, and sriracha.
5. [ ] Pour sauce mixture over chicken. Stir in chopped water chestnuts and sliced green onions. Cook for 2 minutes until heated through and well coated.
6. [ ] Spoon warm chicken filling into chilled, crisp lettuce cups. Garnish with additional scallions and serve right away.
`
  },
  {
    path: "Sides/the-best-baked-mac-and-cheese.md",
    sha: "514f9ec5c12bcbe6cdfd5e0241a080ab8bdb4e76",
    content: `---
title: The Best Baked Mac and Cheese
prep_time: 20 mins
cook_time: 30 mins
servings: 8
difficulty: Medium
tags:
  - sides
  - pasta
  - comfort-food
---

## Ingredients

- [ ] 1 pound elbow macaroni or cavatappi pasta
- [ ] 1/2 cup unsalted butter (1 stick)
- [ ] 1/2 cup all-purpose flour
- [ ] 4 cups whole milk, warmed
- [ ] 2 cups heavy cream
- [ ] 4 cups sharp cheddar cheese, freshly shredded
- [ ] 2 cups Gruyère or Monterey Jack cheese, shredded
- [ ] 1/2 teaspoon garlic powder
- [ ] 1/2 teaspoon smoked paprika
- [ ] 1/4 teaspoon ground nutmeg
- [ ] Salt and freshly cracked black pepper to taste
- [ ] 1 cup panko breadcrumbs tossed with 2 tbsp melted butter

## Instructions

1. [ ] Preheat oven to 375°F (190°C). Grease a 9x13-inch baking dish with butter.
2. [ ] Cook elbow macaroni in salted boiling water for 1 minute less than package al dente directions (about 7 minutes). Drain and rinse with cool water.
3. [ ] In a large heavy Dutch oven, melt 1/2 cup butter over medium heat. Whisk in flour and cook roux for 2 minutes until bubbling and golden.
4. [ ] Gradually pour in warm milk and heavy cream, whisking constantly to prevent lumps. Cook for 5 to 7 minutes until sauce thickens and gently bubbles.
5. [ ] Remove pot from heat. Whisk in garlic powder, paprika, nutmeg, salt, and pepper.
6. [ ] Add 3 cups of cheddar and 1.5 cups of Gruyère cheese in batches, stirring until silky smooth and completely melted into cheese sauce.
7. [ ] Fold cooked pasta into cheese sauce until every noodle is completely submerged and coated.
8. [ ] Pour half the mac and cheese into the prepared baking dish. Sprinkle with remaining shredded cheese, then top with remaining pasta mixture.
9. [ ] Scatter buttered panko breadcrumbs evenly across top.
10. [ ] Bake in preheated oven for 25 to 30 minutes until golden, bubbly, and toasted brown on top. Let rest for 10 minutes before serving.
`
  },
  {
    path: "Deserrts/chocolate-chip-cookies.md",
    sha: "386813cb93cb48a20d4977726a080f32b973e57d",
    content: `---
title: Chewy Brown Butter Chocolate Chip Cookies
prep_time: 20 mins
cook_time: 12 mins
servings: 18
difficulty: Easy
tags:
  - dessert
  - baking
  - cookies
---

## Ingredients

- [ ] 1 cup (2 sticks) unsalted butter
- [ ] 3/4 cup packed dark brown sugar
- [ ] 1/2 cup granulated white sugar
- [ ] 2 large eggs, room temperature
- [ ] 2 teaspoons pure vanilla extract
- [ ] 2 1/4 cups all-purpose flour
- [ ] 1 teaspoon baking soda
- [ ] 1 teaspoon kosher salt
- [ ] 1 1/2 cups semi-sweet chocolate chunks or chips
- [ ] Flaky sea salt (Maldon) for topping

## Instructions

1. [ ] Melt butter in a stainless saucepan over medium heat. Swirl occasionally for 4-5 minutes as butter foams and crackles. Once nutty aroma develops and brown specks appear on bottom, pour into heatproof bowl and let cool for 15 minutes.
2. [ ] In a large bowl, whisk cooled browned butter with dark brown sugar and granulated sugar for 2 minutes until glossy.
3. [ ] Whisk in eggs one at a time, followed by vanilla extract, until mixture is pale and smooth.
4. [ ] Fold in flour, baking soda, and kosher salt with a spatula until just combined without overmixing.
5. [ ] Fold in chocolate chunks. Chill dough in refrigerator for at least 30 minutes (or overnight for deeper caramel flavor).
6. [ ] Preheat oven to 350°F (175°C) and line two baking sheets with parchment paper.
7. [ ] Scoop 2-tablespoon dough mounds 2 inches apart onto baking sheets.
8. [ ] Bake for 10 to 12 minutes until edges are set and golden but centers remain soft.
9. [ ] Immediately sprinkle tops with flaky sea salt. Let cool on baking sheet for 5 minutes, then transfer to a wire rack.
`
  },
  {
    path: "Mexican/sheet-pan-chicken-fajitas.md",
    sha: "cf3e2caf3c90603362eab55524da90bd7acdd352",
    content: `---
title: Sheet Pan Chicken Fajitas
prep_time: 15 mins
cook_time: 20 mins
servings: 4
difficulty: Easy
tags:
  - mexican
  - chicken
  - dinner
  - quick
---

## Ingredients

- [ ] 1.5 lbs boneless skinless chicken breasts, sliced into strips
- [ ] 3 bell peppers (red, yellow, green), sliced into strips
- [ ] 1 large red onion, sliced
- [ ] 3 tablespoons olive oil
- [ ] 2 teaspoons chili powder
- [ ] 1 teaspoon ground cumin
- [ ] 1 teaspoon garlic powder
- [ ] 1 teaspoon smoked paprika
- [ ] 1/2 teaspoon onion powder
- [ ] 1 teaspoon kosher salt
- [ ] 1/2 teaspoon black pepper
- [ ] 1 lime, juiced
- [ ] Warm flour tortillas, sour cream, guacamole, and cilantro for serving

## Instructions

1. [ ] Preheat oven to 425°F (220°C). Lightly grease a large rimmed baking sheet.
2. [ ] In a small bowl, mix together chili powder, cumin, garlic powder, smoked paprika, onion powder, salt, and pepper.
3. [ ] Place chicken strips, bell peppers, and sliced onions on baking sheet.
4. [ ] Drizzle with olive oil, sprinkle fajita seasoning evenly over everything, and toss well to coat. Spread into a single even layer.
5. [ ] Roast in oven for 18 to 22 minutes until chicken is cooked through and vegetables are tender-crisp with charred edges.
6. [ ] Squeeze fresh lime juice over warm sheet pan and garnish with fresh cilantro.
7. [ ] Serve immediately with warm tortillas, guacamole, and sour cream.
`
  },
  {
    path: "Italian/mushroom-risotto.md",
    sha: "0b1309b235719af50d3637ee42b0847c6ea7d17e",
    content: `---
title: Creamy Mushroom Risotto
prep_time: 15 mins
cook_time: 30 mins
servings: 4
difficulty: Medium
tags:
  - italian
  - risotto
  - vegetarian
---

## Ingredients

- [ ] 1 1/2 cups Arborio or Carnaroli rice
- [ ] 1 lb mixed wild mushrooms (cremini, shiitake, oyster), sliced
- [ ] 5 cups vegetable or chicken broth, warmed
- [ ] 1/2 cup dry white wine
- [ ] 1 medium shallot, minced
- [ ] 2 cloves garlic, minced
- [ ] 3 tablespoons extra virgin olive oil
- [ ] 4 tablespoons unsalted butter, divided
- [ ] 1/2 cup freshly grated Parmigiano-Reggiano cheese
- [ ] 2 tablespoons fresh thyme leaves
- [ ] Kosher salt and freshly cracked black pepper

## Instructions

1. [ ] Keep broth warm in a saucepan over low heat.
2. [ ] Heat 2 tablespoons olive oil and 1 tablespoon butter in a Dutch oven over medium-high heat. Add sliced mushrooms and thyme; cook for 6 to 8 minutes until deep golden brown. Season with salt and pepper, then transfer mushrooms to a bowl.
3. [ ] In the same pot, add remaining olive oil and shallot; cook for 2 minutes until translucent. Add minced garlic and cook for 1 minute.
4. [ ] Add Arborio rice. Toast grains for 2 minutes, stirring constantly until rice edges are translucent.
5. [ ] Pour in white wine, stirring continuously for 2 minutes until fully absorbed by rice.
6. [ ] Begin adding warm broth, one ladleful (about 1/2 cup) at a time, stirring frequently until liquid is absorbed before adding next ladle. Repeat for 20 to 25 minutes until rice is tender and creamy with a slight al dente bite.
7. [ ] Remove from heat. Fold in sautéed mushrooms, remaining 3 tablespoons butter, and grated Parmigiano-Reggiano. Season with salt and pepper to taste.
8. [ ] Cover and let rest for 2 minutes. Spoon into shallow bowls and top with extra parmesan and fresh thyme.
`
  }
];

export function getSeedRecipes(): Recipe[] {
  return SEED_DATA.map((item) => {
    const { frontmatter, body } = extractFrontmatter(item.content);
    const pathParts = item.path.split('/');
    const category = pathParts.length > 1 ? pathParts[0] : 'General';
    const filename = pathParts[pathParts.length - 1];
    const { ingredients, instructions, notes } = parseRecipeBody(body, item.path);

    return {
      id: item.path,
      path: item.path,
      category,
      filename,
      sha: item.sha,
      frontmatter,
      rawContent: item.content,
      ingredients,
      instructions,
      notes,
      updatedAt: new Date().toISOString(),
      isFavorite: false
    };
  });
}

