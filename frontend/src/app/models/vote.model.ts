export interface Vote {
  upvotes: number;
  downvotes: number;
  userVote: number | undefined;
  id: number;
  reviewId: number;
  userId: number;
  voteType: VoteType;
  createdAt: string;
  updatedAt?: string;
}

export enum VoteType {
  DOWNVOTE = -1,
  UPVOTE = 1
}

export interface CreateVoteDto {
  reviewId: number;
  voteType: VoteType;
}