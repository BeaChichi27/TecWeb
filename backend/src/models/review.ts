import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import User from './user';
import Restaurant from './restaurant';

class Review extends Model {
  public reviewID!: number;
  public content!: string;
  public authorUserID!: number;
  public restaurantID!: number;
}

Review.init({
  reviewID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Review',
});

User.hasMany(Review, { foreignKey: 'authorUserID' });
Review.belongsTo(User, { foreignKey: 'authorUserID' });

Restaurant.hasMany(Review, { foreignKey: 'restaurantID', onDelete: 'CASCADE' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurantID' });

export default Review;
