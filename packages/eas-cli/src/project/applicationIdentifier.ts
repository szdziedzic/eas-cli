import { ExpoConfig } from '@expo/config';
import { Platform, Workflow } from '@expo/eas-build-job';
import { BuildProfile } from '@expo/eas-json';

import { Actor } from '../user/User';
import {
  ensureApplicationIdIsDefinedForManagedProjectAsync,
  getApplicationIdAsync,
} from './android/applicationId';
import { resolveGradleBuildContextAsync } from './android/gradle';
import {
  ensureBundleIdentifierIsDefinedForManagedProjectAsync,
  getBundleIdentifierAsync,
} from './ios/bundleIdentifier';
import { resolveXcodeBuildContextAsync } from './ios/scheme';
import { findApplicationTarget, resolveTargetsAsync } from './ios/target';
import { resolveWorkflowAsync } from './workflow';

export async function getApplicationIdentifierAsync(
  projectDir: string,
  exp: ExpoConfig,
  buildProfile: BuildProfile,
  platform: Platform,
  actor: Actor
): Promise<string> {
  if (platform === Platform.ANDROID) {
    const profile = buildProfile as BuildProfile<Platform.ANDROID>;
    const workflow = await resolveWorkflowAsync(projectDir, Platform.ANDROID);

    if (workflow === Workflow.MANAGED) {
      return await ensureApplicationIdIsDefinedForManagedProjectAsync(projectDir, exp, actor);
    }

    const gradleContext = await resolveGradleBuildContextAsync(projectDir, profile);
    return await getApplicationIdAsync(projectDir, exp, gradleContext);
  } else {
    const workflow = await resolveWorkflowAsync(projectDir, Platform.IOS);
    const profile = buildProfile as BuildProfile<Platform.IOS>;
    if (workflow === Workflow.MANAGED) {
      return await ensureBundleIdentifierIsDefinedForManagedProjectAsync(projectDir, exp, actor);
    }

    const xcodeBuildContext = await resolveXcodeBuildContextAsync(
      { exp, projectDir, nonInteractive: false },
      profile
    );
    const targets = await resolveTargetsAsync({
      projectDir,
      exp,
      xcodeBuildContext,
      env: profile.env,
    });
    const applicationTarget = findApplicationTarget(targets);
    return await getBundleIdentifierAsync(projectDir, exp, {
      targetName: applicationTarget.targetName,
      buildConfiguration: applicationTarget.buildConfiguration,
    });
  }
}
