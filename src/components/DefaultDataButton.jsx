import React from 'react';
import { BookOpen } from 'lucide-react';

const DefaultDataButton = ({ onLoad }) => {
const handleLoadDefault = async () => {
    try {
    // example data; placeholder for now
    const defaultData = `The quick brown fox jumps over the lazy dog napping in the garden.
                        While thunder rumbles overhead, frightened mice scurry beneath the old barn's floorboards.
                        Beneath Antarctic ice, emperor penguins gracefully glide through frigid waters searching for fish.
                        Deep in the Amazon rainforest, brilliant poison dart frogs hop between massive decaying leaves.
                        As morning mist clears, a lone wolf howls mournfully from the snow-covered mountain peak.
                        The industrious beaver methodically constructs its dam across the rushing mountain stream.
                        Through dense morning fog, ancient sea turtles slowly lumber up tropical beaches to nest.
                        Dazzling hummingbirds dart between crimson flowers, their wings humming like tiny motors.
                        In sunlit meadows, iridescent dragonflies hover motionless above still summer ponds.
                        High in swaying bamboo, giant pandas methodically strip green shoots with their teeth.
                        Under starlit skies, kangaroos bounce effortlessly across vast Australian outback plains.
                        The clever octopus quickly solves the puzzle box, tentacles working with surprising precision.
                        Through African savannas, towering giraffes move gracefully between thorny acacia trees.
                        Deep in frozen tundra, arctic foxes patiently dig through snow seeking hidden lemmings.
                        Along Caribbean reefs, spotted eagle rays soar effortlessly through crystal blue waters.
                        Within dark caves, tiny bats navigate perfectly using sophisticated echolocation calls.
                        Across Siberian forests, massive brown bears fish expertly in salmon-filled streams.
                        The resourceful raccoon carefully washes its food in the clear flowing creek.
                        Among flowering cherry trees, vibrant peacocks display their magnificent feathers proudly.
                        Near bubbling tide pools, clever otters crack shellfish open using small rocks.
                        Not only do elephants remember their family members, but they also mourn their dead.
                        Have you ever watched a chameleon's eyes move independently as it hunts?
                        Just as dolphins use echolocation, bats navigate through pitch-black caves.
                        By working together, tiny leafcutter ants can strip an entire tree overnight.
                        The louder a howler monkey calls, the larger its territory becomes.
                        When winter winds howl across the tundra, arctic foxes burrow deep in the snow.
                        Like skilled acrobats, flying squirrels glide gracefully between towering pines.
                        Each morning, the roadrunner races across the desert in search of lizards and snakes.
                        Through crystal-clear waters, sea turtles gracefully navigate coral reefs.
                        Silently stalking through tall grasslands, the serval hunts with remarkable precision.
                        High in mountain caves, hibernating bears dream of springtime honey and berries.
                        Without making a sound, barn owls swoop down upon unsuspecting field mice below.
                        Across vast savannas, elephant herds follow ancient pathways to seasonal water sources.
                        As twilight approaches, fruit bats emerge from their roosts to pollinate night-blooming flowers.
                        Before the storm arrives, frigate birds soar high above tropical waters seeking calmer skies.
                        The clever octopus changes both color and texture to match its coral reef surroundings perfectly.
                        Within complex underground chambers, naked mole rats maintain sophisticated cooperative societies.
                        Between towering Arctic icebergs, narwhals use their tusks to detect subtle changes in water temperature.
                        Among dense bamboo forests, red pandas carefully navigate slender branches while foraging for leaves.
                        Until the spring rains begin, African lungfish remain dormant in their underground mud cocoons.
                        Every evening at sunset, thousands of starlings create mesmerizing patterns across twilight skies.
                        Deep beneath Antarctic ice, emperor penguins huddle together against bitter winter storms.
                        Beyond the shallow reefs, whalesharks filter countless gallons of water for microscopic plankton.
                        Throughout humid rainforests, poison dart frogs display their brilliant warning colors to potential predators.
                        Beneath decomposing logs, fascinating colonies of termites construct elaborate climate-controlled structures.
                        During brief summer nights, arctic terns make their record-breaking migration from pole to pole.
                        Within the darkest ocean trenches, anglerfish use bioluminescent lures to attract unsuspecting prey.
                        Across windswept Patagonian peaks, Andean condors ride thermal currents with barely a wingbeat.
                        Inside their intricate silk nests, weaver birds carefully tend to their newly hatched chicks.
                        Beneath the scorching desert sun, fennec foxes use their enormous ears to stay cool.
                        While southern right whales breach, their thunderous splashes echo across pristine Antarctic bays.
                        Around geothermal springs, Japanese macaques soak in warm waters during snowy mountain winters.
                        Despite their massive size, manatees gracefully glide through crystal-clear Florida springs.
                        Within dense mangrove forests, proboscis monkeys leap from branch to branch with surprising agility.
                        Through shallow tropical lagoons, spotted eagle rays gracefully patrol for buried shellfish.
                        Under the cover of darkness, slow lorises cautiously explore the canopy searching for tree sap.
                        Between massive rocks in the intertidal zone, giant Pacific octopuses solve complex puzzles for food.
                        Amidst tangled kelp forests, sea otters wrap themselves in seaweed while sleeping on their backs.
                        Among dense bamboo forests, red pandas carefully navigate slender branches while foraging for leaves, just as dolphins use echolocation to find their way through the ocean's depths. 
                        Through crystal-clear waters, sea turtles gracefully navigate coral reefs, while southern right whales breach, their thunderous splashes echoing across pristine Antarctic bays. 
                        Within complex underground chambers, naked mole rats maintain sophisticated cooperative societies, much like tiny leafcutter ants that strip an entire tree overnight by working together. 
                        Deep beneath Antarctic ice, emperor penguins huddle together against bitter winter storms, as twilight approaches and fruit bats emerge from their roosts to pollinate night-blooming flowers.
                        Beneath decomposing logs, fascinating colonies of termites construct elaborate climate-controlled structures, while clever otters crack shellfish open using small rocks near bubbling tide pools. 
                        Across vast savannas, elephant herds follow ancient pathways to seasonal water sources, and not only do elephants remember their family members, but they also mourn their dead. 
                        High in mountain caves, hibernating bears dream of springtime honey and berries, just as flying squirrels glide gracefully between towering pines like skilled acrobats. 
                        Throughout humid rainforests, poison dart frogs display their brilliant warning colors to potential predators, while barn owls swoop down silently upon unsuspecting field mice below.
                        Between towering Arctic icebergs, narwhals use their tusks to detect subtle changes in water temperature, as arctic foxes burrow deep in the snow when winter winds howl across the tundra. 
                        Inside their intricate silk nests, weaver birds carefully tend to their newly hatched chicks, much like the clever octopus that changes both color and texture to match its coral reef surroundings perfectly. 
                        Beyond the shallow reefs, whalesharks filter countless gallons of water for microscopic plankton, while spotted eagle rays gracefully patrol shallow tropical lagoons for buried shellfish. 
                        Under the cover of darkness, slow lorises cautiously explore the canopy searching for tree sap, as anglerfish use bioluminescent lures to attract unsuspecting prey in the darkest ocean trenches.
                        Around geothermal springs, Japanese macaques soak in warm waters during snowy mountain winters, while fennec foxes use their enormous ears to stay cool beneath the scorching desert sun. 
                        Amidst tangled kelp forests, sea otters wrap themselves in seaweed while sleeping on their backs, and giant Pacific octopuses solve complex puzzles for food between massive rocks in the intertidal zone. 
                        Every evening at sunset, thousands of starlings create mesmerizing patterns across twilight skies, as arctic terns make their record-breaking migration from pole to pole during brief summer nights.`;

    const file = new File([defaultData], 'default_examples.txt', {
        type: 'text/plain'
    });

    onLoad(file);
    } catch (error) {
    console.error('Error loading default data:', error);
    }
};

return (
    <button
    onClick={handleLoadDefault}
    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
    <BookOpen className="w-5 h-5 mr-2" />
    Load Example Data
    </button>
);
};

export default DefaultDataButton;