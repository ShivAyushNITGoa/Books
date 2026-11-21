# Geography and cinematography review

## What the previous film improved—and what it still missed

The user's assessment of `black-box-locations` was **“a bit good”**, followed by a request for a much more substantial, professional recreation. Separate coordinates were an improvement over the rejected single-room pavilion, but were not sufficient to make a convincing geographic journey.

This review used the previous project's complete world/camera implementation and its saved film contact sheet, followed by iterative rendered comparisons of the new geography. It is not an assertion of a full manual audio/video watch or reference-film parity.

| Weakness in the previous implementation | Why it mattered | Corrective work |
|---|---|---|
| About 150 similar conifer trees in a small story-centred ring | The forest looked like a limited set surrounding a prop, not a large mixed habitat | Region-wide coherent biome population, seven tree types, different ages/heights, bushes, fallen timber, rocks and an irregular clearing; over fourteen thousand rooted trees |
| Small rectangular clearing floor and separate square seabed plate | Visible straight edges exposed the construction as disconnected patches | One indexed land-to-bathymetry surface; the clearing is a smooth deformation of that field, not an added platform |
| Straight land edge and abrupt water boundary | A nominal ocean existed, but the coastline read as a geometric edge | Shared analytic winding coast, coves/headlands, gradually submerged shelf, depth-coloured open water and shoreline surf |
| Roads assembled from straight floating boxes | Infrastructure did not convincingly join the places | Sampled road ribbons, shoulders, markings, roadside furniture, coherent planting setbacks, a dirt search trail, regional junction and raised river bridge |
| Long travel frequently aimed at nearly empty ground | The camera moved through coordinates without explaining the geography | Longer outbound journey, horizon-biased bearings, shared woodland ridge/coast/vessel/estuary landmarks and a small geographic orientation inset |
| A second temporal exposure during travel | Ghosted edges made real terrain and shorelines harder to follow | One spatial camera, **one temporal render sample per output frame** |
| Pure look-at eye/aim interpolation | Continuous positions can still create near-instant orientation flips when eye/aim bearings cross | Explicit curved approaches, hemisphere-consistent quaternion transport and deterministic spherical travel smoothing; dense angular-step and horizon-bank gates |
| Technical checks focused mainly on the recorder | Passing close-up tests did not prove environmental continuity | Terrain/river/coast/forest distribution tests, all-frame camera-to-terrain clearance, spatial population metrics and full-journey rendered review |

## Geographic design

The factory is a real enclosed building in an industrial enclave, not the container for the film. Its doorway leads into its yard, then a road through mixed woodland. The crash clearing is contained within a much larger forest population, whose tree distribution continues over the surrounding slopes and distant ridges.

The coast is a function of north/south position rather than a rectangular mesh edge. The same heightfield continues under the sea, so there is no gap between beach, continental shelf and the recorder's 40 m-deep seabed. A river descends through a broad valley, remains below its water surface and joins the estuary. Airport drainage and terrain shoulders keep the river outside the engineered runway pad. The harbour pier has piles to the actual ground and a ramp meeting the mainland and deck heights.

The regional road joins the factory, woodland, river bridge, harbour and airport branch. Moving vehicles follow the same centreline used to build the road and vegetation setback, instead of sliding across unrelated terrain. Lighthouse, search vessel, river crossing, tower and airport buildings serve as scale and orientation cues.

## Environment construction

- `environment/field.js`: deterministic coherent noise, continuous elevation, normal, coast, river, biome and engineered-pad sampling.
- `environment/terrain.js`: one indexed surface with nonuniform resolution, blended biome colours, object-space surface grain, true bathymetry and preserved vertex attributes.
- `environment/vegetation.js`: deterministic regional population and species selection, varied height/yaw/tint, camera/sightline planting exclusions, understorey and spatially partitioned instancing.
- `environment/infrastructure.js`: road geometry, bridge, trail, road signs, connected vehicle motion and inhabited roadside landmarks.
- `environment/water.js`: open-sea depth/Fresnel/surf shader, connected river mesh and restrained underwater particulates.
- `environment/atmosphere.js`: one horizon, distant haze, slow clouds, common sun direction and depth-dependent underwater atmosphere.
- `sites/`: five environment-specific built/evidence layers, placed on the common field rather than independent outdoor floors.
- `direction/`: pure deterministic curve/acting functions; no frame-history-dependent camera or random animation.

## Camera direction and genuine problems caught during revision

The outbound factory-to-forest journey is given more time than before. A low exterior reveal establishes the road and mixed woodland before the climb; subsequent travel keeps some horizon and visible landmarks instead of using long near-vertical views of empty grass. Return travel crosses the river/bridge corridor before descending to the airport.

Dense quaternion inspection caught a **180-degree frame-to-frame orientation flip** in an intermediate route, even though eye and aim positions were mathematically continuous. Later intermediate approaches also crossed too close to vertical over the recovery pier and beacon example. These were not accepted as “continuous” simply because a C1 position test passed. The approaches were curved, departure windows redistributed, and travel bearings filtered as a hemisphere-consistent quaternion field. Final gates require **under 10 degrees per output frame** and **under 7 degrees of horizon bank**, as well as continuous position and grounded terrain clearance.

The filter rotates the same camera. It does not cut, teleport, crossfade, alter terrain or blend scene pictures. Full-focus views release travel smoothing and use conservative recorder fitting, so the subject stays legible and deliberately off-centre. Person silhouettes are checked against the actual resulting camera, including travel ramps.

## Intentional limits

The existing English script and selected voice remain exactly the same length. Travelling kilometre-scale geography within those 65 seconds requires **time-compressed motion**; this is not a claim of plausible real-time drone speed. The small map provides geographic orientation without replacing the actual landscape with a map shot.

The forest/ocean wreckage are independent illustrative examples, not one aircraft crashing twice or a reconstruction of a real accident. The species names describe stylized silhouettes, not a surveyed ecological habitat. The underwater rings explain acoustic location; they are not visible real-world waves, underwater radio or GPS.

There is no claim of railway-reference visual parity. Numerical coverage, code length, tests and render completeness support reproducibility and regression prevention; they do not constitute artistic approval.
