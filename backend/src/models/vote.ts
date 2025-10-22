import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import User from './user';
import Review from './review';

class Vote extends Model {
  public voteID!: number;
  public voteType!: 'upvote' | 'downvote';
  public voterUserID!: number;
  public reviewID!: number;
}

Vote.init({
  voteID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  voteType: {
    type: DataTypes.ENUM('upvote', 'downvote'),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Vote',
});

User.hasMany(Vote, { foreignKey: 'voterUserID', as: 'votes' });
Vote.belongsTo(User, { foreignKey: 'voterUserID', as: 'voter' });

Review.hasMany(Vote, { foreignKey: 'reviewID', onDelete: 'CASCADE', as: 'vote' });
Vote.belongsTo(Review, { foreignKey: 'reviewID', as: 'review' });

export default Vote;
