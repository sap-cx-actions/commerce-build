import axios, { AxiosInstance } from 'axios'
import { BuildProgress, BuildRequest, BuildResponse } from '../models/build'

export class BuildService {
  private readonly API_URL: string = 'https://commerce-cloud.vercel.app/v2'
  private readonly token: string
  private readonly subscriptionCode: string
  private readonly axiosInstance: AxiosInstance

  constructor(token: string, subscriptionCode: string) {
    this.token = token
    this.subscriptionCode = subscriptionCode

    this.axiosInstance = axios.create({
      baseURL: this.API_URL,
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })
  }

  /**
   * Creates a new build for a given subscription code.
   *
   * @param buildRequest - The build request to create a build for.
   * @returns A promise that resolves to the build response.
   * @throws An error if the build cannot be created.
   */
  async createBuild(buildRequest: BuildRequest): Promise<BuildResponse> {
    const apiUrl = `/subscriptions/${this.subscriptionCode}/builds`
    try {
      const response = await this.axiosInstance.post<BuildResponse>(
        apiUrl,
        buildRequest
      )
      return response.data
    } catch (error) {
      throw new Error(`Error creating build: ${(error as Error).message}`)
    }
  }

  /**
   * Fetches the build details for a given build code.
   *
   * @param buildCode - The code of the build to fetch details for.
   * @returns A promise that resolves to the build response.
   * @throws An error if the build response cannot be fetched.
   */
  async getBuild(buildCode: string): Promise<BuildResponse> {
    const apiUrl = `/subscriptions/${this.subscriptionCode}/builds/${buildCode}`
    try {
      const response = await this.axiosInstance.get<BuildResponse>(apiUrl)
      return response.data
    } catch (error) {
      throw new Error(
        `Error fetching build response: ${(error as Error).message}`
      )
    }
  }

  /**
   * Fetches the build progress for a given build code.
   *
   * @param buildCode - The code of the build to fetch progress for.
   * @returns A promise that resolves to the build progress.
   * @throws An error if the build progress cannot be fetched.
   */
  async getBuildProgress(buildCode: string): Promise<BuildProgress> {
    const apiUrl = `/subscriptions/${this.subscriptionCode}/builds/${buildCode}/progress`
    try {
      const response = await this.axiosInstance.get<BuildProgress>(apiUrl)
      return response.data
    } catch (error) {
      throw new Error(
        `Error fetching build response: ${(error as Error).message}`
      )
    }
  }
}
