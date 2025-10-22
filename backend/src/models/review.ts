import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import User from './user';
import Restaurant from './restaurant';

class Review extends Model {
  public reviewID!: number;
  public content!: string;
  public rating!: number;
  public authorUserID!: number;
  public restaurantID!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
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
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
}, {
  sequelize,
  modelName: 'Review',
  timestamps: true,
});

User.hasMany(Review, { foreignKey: 'authorUserID', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'authorUserID', as: 'author' });

Restaurant.hasMany(Review, { foreignKey: 'restaurantID', onDelete: 'CASCADE', as: 'reviews' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurantID', as: 'restaurant' });

export default Review;
