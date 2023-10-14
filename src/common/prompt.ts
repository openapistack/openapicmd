import inquirer = require("inquirer")
import { getContext } from "./context"
import cli from 'cli-ux';

export const maybePrompt = async <T>(questions: inquirer.QuestionCollection<T>, initialAnswers?: Partial<T>): Promise<T> => {
  const context = getContext()

  if (context.flags?.interactive !== false) {
    return inquirer.prompt<T>(questions, initialAnswers)
  }

  return {} as T
}

export const maybeSimplePrompt = async (...args: Parameters<typeof cli.prompt>) => {
  const context = getContext()

  if (context.flags?.interactive !== false) {
    return cli.prompt(...args)
  }

  return undefined
}