import type { CalculateMetadataFunction } from "remotion";
import { Composition, Still } from "remotion";
import { defaultProject, youtubeSample } from "../shared/defaults";
import { getTimeline } from "../shared/timeline";
import type { Project } from "../shared/types";
import { ShortVideo } from "./ShortVideo";
import { Thumbnail } from "./youtube";
import "./fonts";

const calculateMetadata: CalculateMetadataFunction<Project> = ({ props }) => {
  const timeline = getTimeline(props);
  return {
    durationInFrames: timeline.durationInFrames,
    fps: timeline.fps,
    width: timeline.width,
    height: timeline.height,
  };
};

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={getTimeline(defaultProject).durationInFrames}
        fps={30}
        width={getTimeline(defaultProject).width}
        height={getTimeline(defaultProject).height}
        defaultProps={defaultProject}
        calculateMetadata={calculateMetadata}
      />
      <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} defaultProps={youtubeSample} />
    </>
  );
}
