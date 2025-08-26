export class XPCalculator {
  private static readonly BASE_COMPLETION_XP = 10;
  private static readonly CORRECT_ANSWER_XP = 5;
  private static readonly PERFECT_SCORE_BONUS = 20;
  private static readonly SPEED_BONUS_THRESHOLD = 0.5; // 50% of allotted time
  private static readonly SPEED_BONUS_XP = 15;

  static calculateXP(
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number,
    maxTimeAllowed: number
  ): number {
    let totalXP = 0;

    // Base completion XP
    totalXP += this.BASE_COMPLETION_XP;

    // Correct answer XP
    totalXP += correctAnswers * this.CORRECT_ANSWER_XP;

    // Perfect score bonus
    if (correctAnswers === totalQuestions && totalQuestions > 0) {
      totalXP += this.PERFECT_SCORE_BONUS;
    }

    // Speed bonus (if completed in less than 50% of allowed time)
    if (timeSpent < maxTimeAllowed * this.SPEED_BONUS_THRESHOLD) {
      totalXP += this.SPEED_BONUS_XP;
    }

    // Question quantity bonus (more questions = more XP potential)
    if (totalQuestions >= 20) {
      totalXP += 10;
    } else if (totalQuestions >= 10) {
      totalXP += 5;
    }

    return Math.max(totalXP, 1); // Minimum 1 XP
  }

  static getXPBreakdown(
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number,
    maxTimeAllowed: number
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};

    breakdown.completion = this.BASE_COMPLETION_XP;
    breakdown.correctAnswers = correctAnswers * this.CORRECT_ANSWER_XP;
    
    if (correctAnswers === totalQuestions && totalQuestions > 0) {
      breakdown.perfectScore = this.PERFECT_SCORE_BONUS;
    }

    if (timeSpent < maxTimeAllowed * this.SPEED_BONUS_THRESHOLD) {
      breakdown.speedBonus = this.SPEED_BONUS_XP;
    }

    if (totalQuestions >= 20) {
      breakdown.quantityBonus = 10;
    } else if (totalQuestions >= 10) {
      breakdown.quantityBonus = 5;
    }

    return breakdown;
  }
}