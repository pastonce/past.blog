## 1 数据集介绍及处理

`MNIST`数据集是一个广泛使用的手写数字识别数据集，该数据集包含了来自 250 个不同人手写的数字图片，其中一半是高中生，另一半来自人口普查局的工作人员。数据集分为训练集和测试集，训练集包含 60,000 张图片，测试集包含 10,000 张图片，每张图片的大小为 28×28 像素（在数据中被展平为 **1×784 维**），图片中的数字以黑底白字的形式呈现，用 0 到 255 之间的灰度值表示。

考虑到降维之后的结果可视化难以支撑太多的数据，对原始的训练集进行**分层的随机采样**，仅使用训练集中的 **400 条样本**，如下：

```python
# 获取完整MNIST数据集并分层采样400条
from torchvision import datasets
from sklearn.model_selection import StratifiedShuffleSplit

# 下载完整MNIST训练集
mnist_train = datasets.MNIST(root='./data/mnist_raw', train=True, download=True, 
                             transform=None)  # 不进行任何转换，保留原始像素值

# 转换为numpy数组
X_all = np.array([np.array(img, dtype=np.uint8).flatten() for img, _ in mnist_train])
y_all = np.array(mnist_train.targets)

print(f"完整MNIST数据集大小: {X_all.shape[0]}")
print(f"每个样本维度: {X_all.shape[1]} (28x28=784)")

# 分层采样400条样本
splitter = StratifiedShuffleSplit(n_splits = 1, test_size = 400, random_state = 42)
train_idx, test_idx = next(splitter.split(X_all, y_all))

X_sample = X_all[test_idx]
y_sample = y_all[test_idx]

print(f"\n采样后数据集大小: {X_sample.shape[0]}")
print(f"像素值范围: [{X_sample.min()}, {X_sample.max()}]")
# 保存为CSV
X_sample_with_label = np.column_stack([y_sample, X_sample])
df_sample = pd.DataFrame(X_sample_with_label)
df_sample.to_csv('./data/mnist_400.csv', header = False, index = False)
```

由此得到的样本形状为`(400, 784)`，数据集中第一列为标签列，形状为`(400,)`.

## 2 PCA算法

### 2.1 基本原理

主成分分析（`Principal Component Analysis, PCA`）是一种常用的数据线性降维方法，可以将高维数据转换为低维空间，同时保留原始数据中最具代表性的信息。

`PCA`算法是基于高维空间样本点投影到一个超平面上进而转化为低维空间样本点的过程中应具有的性质推导而来的，具体为以下两点：

* **最近重构性**：样本点到这个超平面的距离都足够近；
* **最大可分性**：样本点在这个超平面上的投影能尽可能分开。

`PCA`算法的基本思路如下：

* 首先对样本进行中心化，使得 $ \sum_i x_i = 0 $ ；假定投影变换后的得到的新坐标系为 $ \{w_1, w_2, \dots, w_{d'}\} $ ， $ w_i $ 为标准正交基；
* 易知 $ z_{ij} = w_j^Tx_i $ 是 $ x_i $ 在低维坐标系下第 $ j $ 维的坐标；若将维度降低到 $ d' < d $ ，则基于 $ z_i $ 来重构 $ x_i $ 可以得到重构坐标 $ \hat x_i = \sum_{i=1}^{d'} z_{ij}w_j $ ；
* 那么整个训练集中原样本与重构样本之间的距离为：
$$
\sum_{i=1}^m || \sum_{j=1}^{d'} z_{ij}w_j - x_i ||_2^2 = \sum_{i=1}^m z_i^Tz_i - 2\sum_{i=1}^m z_i^TW^Tx_i + const \\
\propto -tr(W^T(\sum_{i=1}^m x_ix_i^T)W)
\tag{1}$$
* 根据最近重构性，(1)式应最小化，**由此可得`PCA`算法的优化目标**：
$$
\min_W \ \ -tr(W^TXX^TW) \\
s.t. \ \ W^TW = 1
\tag{2}$$
* 从最大可分性考虑，若所有样本的投影能尽可能分开，则应该使投影后样本点的方差最大化，又可知该方差为 $ \sum_i W^Tx_ix_i^TW $ ，同样得到与(2)式等价的优化目标：
$$
\max_W \ \ tr(W^TXX^TW) \\
s.t. \ \ W^TW = 1
\tag{3}$$
* 构造拉格朗日函数并令其梯度为 0 ，解优化问题可得 $ XX^TW = \lambda W $ ；
* 所以，只需对协方差矩阵 $ XX^T $ 进行特征值分解，**取最大的前 $ d' $ 个特征值对应的特征向量**构成投影矩阵 $ W = (w_1, w_2, \dots, w_{d'}) $ ，这就是主成分分析的解；进而可得到降维后的样本坐标 $ z_i = W^Tx_i $.

### 2.2 代码实现

首先对样本点进行中心化，然后计算协方差矩阵并利用`numpy`库函数计算其特征值和特征向量，注意这里使用的`np.linalg.eig`函数会返回虚部为 0 的虚数，所以计算完需要取实部；

```python
# 对所有样本进行中心化
mean = np.mean(X, axis = 0)
X_central = X - mean

# 计算协方差矩阵，并求特征值和特征向量
cov = np.cov(X_central, rowvar = 0)
value, vector = np.linalg.eig(np.mat(cov))
value = value.real
vector = vector.real
```

其次若传入了重构阈值列表，则计算相应的目标维度矩阵`d_list`，否则直接根据指定的目标维度列表`d_list`，依次取最大的`d`个特征值对应的特征向量构成投影矩阵，从而计算降维后样本坐标以及重构坐标；最后使用**均方误差**来计算重构误差。

```python
# 取最大的若干个特征值对应的特征向量构成投影矩阵
valIndex = np.argsort(-value)
val_sum = np.sum(value)
if t_list:
    for t in t_list:
        d = 0
        sum = 0
        while (sum < val_sum * t):
            sum += value[d]
            d += 1
        d_list.append(d)

print("d_list: ", d_list)
error_list = []
for d in d_list:
    vector_d = np.array(vector[: , valIndex[: d]])        # 投影矩阵 W

    # 进行数据降维和重构
    X_low = np.dot(X_central, vector_d)
    X_recon = np.dot(X_low, vector_d.T) + mean

    # 计算重构误差(采取均方误差)
    error = abs(np.mean((X - X_recon) ** 2)).astype('float')
    error_list.append(error)
```

## 3 t-SNE算法

### 3.1 基本原理

t-分布随机邻域嵌入(`t-distributed Stochastic Neighbor Embedding, t-SNE`)算法是一种非线性降维算法，常用于流形学习的降维过程中，非常适合将高维数据降维到 2 维或 3 维进行可视化；`t-SNE`算法是由`SNE`算法发展而来，并在`Symmetric SNE`算法上改进得到的。

该类算法的基本思路是同时将高维空间和低维空间样本点之间的相似度转化为概率分布（相似的对象在彼此的概率分布中概率较大，反之则较小），通过迭代不断调整低维空间的样本坐标，**使其概率分布与高维空间的概率分布尽可能相似**，从而达到降维的同时尽可能保留数据**局部特征**的目的。

* **SNE 算法**

`SNE`采取**将欧氏距离转换为条件概率**的方法来表达样本点之间的相似度，高维空间下的条件概率表达式为：
$$
p_{j|i} = \frac{\exp (-||x_i - x_j||^2 / 2\sigma_i^2)}{\sum_{k \ne i} \exp (-||x_i - x_k||^2 / 2\sigma_i^2)}
\tag{4}$$

其中 $ \sigma_i $ 通常取值以 $ x_i $ 为中心的高斯均方差；且令 $ p_{i|i} = 0 $ 。

对于低维空间的条件概率，指定其高斯分布的均方差为 $ \frac{1}{\sqrt 2} $ ，则其表达式为：

$$
q_{j|i} = \frac{\exp (-||y_i - y_j||^2)}{\sum_{k \ne i} \exp (-||y_i - y_k||^2)}
\tag{5}$$

同样令 $ q_{i|i} = 0 $ 。

根据算法思路，对每个`i`、`j`， $ q_{j|i} $ 与 $ p_{j|i} $ 要尽可能地接近，所以可以**采用`KL`散度**来衡量这两个概率分布之间的“距离”，从而得到损失函数：
$$
C = \sum_i KL(P_i|Q_i) = \sum_i \sum_j p_{j|i}\log \frac{p_{j|i}}{q_{j|i}}
\tag{6}$$

简单分析可得：用较小的 $ q_{j|i} $ 来衡量较大的 $ p_{j|i} $ 比用较大的 $ q_{j|i} $ 来衡量较小的 $ p_{j|i} $ 带来的损失相对更大，即该算法可能更趋向于保留数据的局部特征而不是整体特征。

另外，对于高维空间 $ \sigma_i $ 的设置，`SNE`算法使用了**困惑度**(`perplexity`)的概念，即：
$$
Perp(P_i) = 2^{H(P_i)}
\tag{7}$$
$$
H(P_i) = -\sum_j p_{j|i}\log_2 p_{j|i}
\tag{8}$$

**困惑度近似等于一个点附近有效近邻点的个数**，通常在 5 ~ 50 之间选定；然后对每个样本点 $ x_i $ 都用二分搜索查找到对应的 $ \sigma_i $ ，使得其困惑度近似为指定值。

迭代过程中可以使用**梯度下降法**来降低损失，经过一系列计算可以得到(6)式的梯度为：
$$
\nabla_{y_i} C = 2\sum_j (p_{j|i} - q_{j|i} + p_{i|j} - q_{i|j})(y_i - y_j)
\tag{9}$$

`SNE`算法还引入了一个动量参数 $ \alpha $ 让迭代在上一次更新方向的一定范围内进行，该参数可根据迭代次数变化，可以加速优化过程和避免陷入局部最优解，类似于物理学中的“惯性”，从而得到迭代更新公式如下：

$$
Y^{(k+1)} = Y^{(k)} + \eta \nabla_{Y^{(k)}} C + \alpha(k)(Y^{(k)} - Y^{(k-1)})
\tag{10}$$

* **Symmetric SNE 算法**

上述原始的`SNE`算法中，可以发现当 $ p_{j|i} $ 与 $ q_{j|i} $ 的分子中出现异常值时，很可能会导致后续的数值溢出问题；而且对`KL`散度损失函数梯度的计算也较为复杂；

对称`SNE`算法则**使用联合概率分布来替换条件概率分布**，认为对任意的 $ i、j $ ， $ p_{ji} = p_{ij} $ 且 $ q_{ji} = q_{ij} $ ，并将联合概率分布定义修正为: $ p_{ij} = \frac{p_{i|j} + p_{j|i}}{2} $ ，这可以在一定程度上减小异常值的影响；

最大的优点是梯度的计算变得更加简单了，即：
$$
\nabla_{y_i} C = 4\sum_j (p_{ij} - q_{ij})(y_i - y_j)
\tag{11}$$

* **t-SNE 算法**

但对称`SNE`算法还有可优化之处，由前文分析可知：`SNE`算法在降维时更趋向于用较大的 $ q $ 来衡量较小的 $ p $ 而不是反之，这会在一定程度上造成拥挤问题；`t-SNE`算法则选择在对称`SNE`的基础上，**在低维空间使用更加偏重长尾的`t`分布将距离转化为概率**，从而缓解拥挤问题。

使用了`t`分布之后，低维空间的概率计算公式改变如下：

$$
q_{ij} = \frac{(1 + ||y_i - y_j||^2)^{-1}}{\sum_{k \ne i}{(1 + ||y_i - y_k||^2)^{-1}}}
\tag{12}$$

损失函数的梯度也要相应改变：
$$
\nabla_{y_i} C = 4\sum_j (p_{ij} - q_{ij})(y_i - y_j)(1 + ||y_i - y_j||^2)^{-1}
\tag{13}$$

基于`t`分布的长尾性，对于较大相似度的点，`t`分布在低维空间中的距离需要稍小一点；而对于低相似度的点，`t`分布在低维空间中的距离需要更远。这正符合算法想要的降维效果。

### 3.2 代码实现
样本欧氏距离计算，可以利用 $ ||x_i - x_j||^2 = x_i^Tx_i - 2x_i^Tx_j + x_j^Tx_j $ 来实现距离矩阵的快速计算。

```python
def distance(X):
    n, d = np.shape(X)
    sum_x = np.sum(np.square(X), axis = 1)
    dist = np.add(np.add(-2 * np.dot(X, X.T), sum_x).T, sum_x)
    return dist.astype(np.float64)
```

以高维空间某一样本点为中心计算概率分布，同时计算相应的熵，为后续的二分搜索做准备；需要注意要将自己到自己的概率置为 0 .

```python
def prob_H(dist, index = 0, beta = 1.0):
    # 对距离矩阵进行归一化
    dist /= np.max(dist)
    prob = np.exp(-dist * beta)
    prob = np.maximum(prob, 1e-12)

    # 设置自己的概率为 0
    prob[index] = 0
    sum_prob = np.sum(prob)
    H = np.log(sum_prob) + beta * np.sum(dist * prob) / sum_prob
    prob /= sum_prob
    return prob, H
```

用**二分搜索**查找样本点在给定困惑度下对应的 $ \sigma_i\ (beta) $ ，并计算最终总体的概率分布；本实验选择**直接以熵的接近程度为指标**来进行搜索；权衡时间代价和搜索的精准度，最终设置搜索次数不超过 50 .

```python
def seach_prob(X, tol = 1e-5, perp = 30.0):    
    # 初始化参数
    n, d = np.shape(X)
    dist = distance(X)
    all_prob = np.zeros((n, n))
    beta = np.ones((n, 1))      # 高斯分布参数
    H0 = np.log(perp)       # 以熵的差距来搜索
 
    for i in range(n):
        # 初始化上下界
        betamin = -np.inf
        betamax = np.inf
        prob, H = prob_H(dist[i], i, beta[i])
 
        # 二分搜索，寻找对应 prep 下的 beta 和 prob
        diff = H - H0
        loop = 0        # 搜索次数
        while np.abs(diff) > tol and loop < 50:
            if diff > 0:
                betamin = beta[i].copy()
                if betamax == np.inf or betamax == -np.inf:
                    beta[i] = beta[i] * 2
                else:
                    beta[i] = (beta[i] + betamax) / 2
            else:
                betamax = beta[i].copy()
                if betamin == np.inf or betamin == -np.inf:
                    beta[i] = beta[i] / 2
                else:
                    beta[i] = (beta[i] + betamin) / 2
 
            # 更新 perb, prob 值
            prob, H = prob_H(dist[i], i, beta[i])
            diff = H - H0
            loop += 1
        # 记录 prob 值
        all_prob[i, ] = prob
    return all_prob
```

`t-SNE`算法主体函数，主要进行梯度下降的迭代过程；迭代前先**随机生成**目标维度下的数据`y`，并计算高维数据的概率分布`P`；迭代过程中每次均用`t`分布计算低维样本的概率分布`Q`，然后计算损失函数的梯度，最后用梯度下降法更新低维样本数据，**直到达到最大迭代次数或间隔 10 次迭代的更新幅度小于阈值**。

```python
def tsne(X, dim = 2, perp = 30.0, tol = 1e-5, max_iter = 10000):
    # 初始化参数和变量
    n, d = np.shape(X)
    iter = 0        # 迭代次数
    eta = 500       # 学习率
    cost_old = 0.0      # 10 轮前迭代的损失值
    cost_new = 0.0      # 当前轮迭代的损失值
    cost_delta = 1.0        # 前后两次迭代损失值的变化量
    initial_momentum = 0.5      # 前期动量参数
    final_momentum = 0.8        # 后期动量参数
    y = np.random.randn(n, dim)     # 随机生成低维数据
    gradient = np.zeros((n, dim))       # KL 散度损失的梯度
    delta_y = np.zeros((n, dim))        # 低维样本每次迭代的变化量

    # 迭代前预处理
    P = seach_prob(X, 1e-5, perp)
    P = P + np.transpose(P)     # 对称化
    P = P / np.sum(P)       # 归一化
    P = P * 4       # 提前夸大
    P = np.maximum(P, 1e-12)        # 避免后续计算数值下溢

    # 梯度下降
    while iter < max_iter and cost_delta > tol:
        # 计算降维后样本点的概率分布
        sum_y = np.sum(np.square(y), axis = 1)
        q_prob = 1 / (1 + np.add(np.add(-2 * np.dot(y, y.T), sum_y).T, sum_y))
        q_prob[range(n), range(n)] = 0      # 设置自己的概率为 0 
        Q = q_prob / np.sum(q_prob)
        Q = np.maximum(Q, 1e-12)        # 避免后续计算数值下溢
 
        # 计算 KL 散度损失函数的梯度
        PQ = P - Q
        for i in range(n):
            gradient[i, :] = np.sum(np.tile(PQ[: , i] * q_prob[: , i], (dim, 1)).T 
            * (y[i, :] - y), axis = 0)

        # 迭代更新低维样本数据
        if iter < 100:
            momentum = initial_momentum
        else:
            momentum = final_momentum
        delta_y = momentum * delta_y - eta * gradient
        y = y + delta_y
        y = y - np.tile(np.mean(y, axis = 0), (n, 1))       # 中心化

        # 计算迭代过程中的损失
        if (iter + 1) % 10 == 0:
            cost_old = cost_new
            if iter > 100:
                cost_new = (np.sum(P * np.log(P / Q))).astype("float")
            else:
                cost_new = np.sum(P/4 * np.log(P/4 / Q)).astype("float")
            cost_delta = abs(cost_new - cost_old)
            print("Iteration", (iter + 1), ": error is ", cost_new)
        # 迭代一定次数后还原
        if iter == 100:
            P = P / 4
        iter += 1
    print("finished")
    print("iter:", iter)
    return y, iter, cost_new
```

上述代码中使用了一些优化技巧，比如设置动量参数来控制迭代过程的“惯性”大小；将降维过程根据迭代次数分为前后两个阶段，前期对`P`进行适当放大，动量参数设置得小一些，后期将`P`对应地还原，动量参数调大，这样相当于在前期快速选好最优点的大体迭代方向，后期则在大方向的基础上一步步修正，可以加速收敛、避免陷入局部最优解。

## 4 结果可视化与对比

### 4.1 不同重构阈值下的PCA降维结果对比

数据经过降维后必定会损失一定的信息，算法希望在实现降维的同时尽可能多地保留原数据的所有信息，在 PCA 中体现为降维后的数据经过投影矩阵计算得到的重构数据与原始数据的差别尽可能小。

又因为投影矩阵是通过选择的主成分数量决定的，因此可以使用**重构阈值**`t`来衡量数据降维后的信息保留程度，即满足：

$$
\frac{\sum_{i = 1}^{d'}\lambda_i}{\sum_{i = 1}^{d}\lambda_i} \ge t
\tag{14}$$

其中，$\lambda_i$ 是第`i`个主成分对应的特征值。

通过设置不同的重构阈值`t`，进行多次 PCA 降维（均降至2维），可以观察到保留主成分的数量以及重构误差的变化，结果图可视化如下：

![不同重构阈值下 PCA 降维的均方重构误差随主成分数量的变化折线图](https://pastonce.github.io/data_visualization/homework2/img/error_dimension.png)
<center>图1：不同重构阈值下 PCA 降维的均方重构误差随主成分数量的变化折线图</center>

* 可以看到随着目标维度（重构阈值）的增大，重构误差始终在减小，但减小的趋势先快后慢，这说明**高维数据是存在一定的冗余信息的**；且将原始 784 维的数据降至 106 维才损失了约 5% 的数据信息，可以看到 PCA 很擅长快速削减较高的维度；
* 观察横坐标与重构误差下降程度，可以知道目标维度在 [48, 67] 左右时，既可以保留原数据大部分的结构信息（重构误差降低得够多），也可以使目标维度尽量得小。

### 4.2 不同困惑度下的t-SNE降维结果对比

使用 t-SNE 算法进行数据降维时，困惑度是一个重要的超参数。它可以被理解为优化过程中考虑的邻近点数量，代表了 t-SNE 算法中**每个点的有效邻域大小**。本实验试图通过设置从 5 到 50 设置不同的困惑度，进行多次 t-SNE 降维（均降至 2 维），探究困惑度参数对降维的影响效果，结果图可视化如下：

![t-SNE 降维的 KL 散度损失和迭代步数随困惑度的变化折线图](https://pastonce.github.io/data_visualization/homework2/img/perplexity_cost_iteration.png)
<center>图2：t-SNE 降维的 KL 散度损失和迭代步数随困惑度的变化折线图</center>

* 可以看到随着困惑度的逐步提高，迭代停止需要的总步数（均为超过默认迭代步数上限 10000）几乎成直线下降，这说明 t-SNE 算法的梯度下降过程越来越容易迭代；
* 但是观察 KL 散度损失的变化折线，发现在困惑度处于 5 到 40 范围内 KL 散度损失均无较大的变化，这说明 t-SNE 算法**对于一定范围内的困惑度取值不太敏感且收敛较为一致**，无论快慢均能得到相似的结果；
* 而在困惑度等于 50 时 KL 散度损失暴增 2 倍，同时迭代次数也降为仅仅 90 步，结合使用数据集的信息（400 条样本，10 个类别），猜测困惑度的作用可能在于预估每个类的元素数量。如果强行让其大于单簇的样本数进行降维，可能会导致算法性能下降，因为算法会试图在全局上保持局部特性，这在单簇样本数量有限的情况下是不现实的。

### 4.3 PCA 和 t-SNE 降维效果对比

为对比两种算法的差异，统一将原数据降至 2 维，根据第二节的分析，t-SNE 算法的困惑度选定为 40，将降维结果根据类别绘制为散点图，如下：

![PCA 降维结果散点图](https://pastonce.github.io/data_visualization/homework2/img/pca_2_pro.png)
<center>图3：PCA 降维结果散点图</center>

![t-SNE 降维结果散点图](https://pastonce.github.io/data_visualization/homework2/img/tsne_2_pro.png)
<center>图4：t-SNE 降维结果散点图</center>

* 对比可知，在当前测试环境下，**PCA 算法的降维效果不如 t-SNE 算法**。t-SNE 的降维结果中 10 类数据点各自的聚簇效果更加明显，而 PCA 的降维结果未能良好分离不同类的数据，因为根据图 1 可知此时的重构误差已经超过了 50%；
* 另外，还可以发现 **PCA 降维后数据的坐标取值范围更大，不如 t-SNE 降维后的数据坐标取值集中**，这可能得益于 t-SNE 算法主要依据拟合概率分布来降维，因此不太受原始数据未归一化影响。

### 4.4 算法特点总结

* `PCA`属于线性降维算法，运行时间相对较快，**倾向于保留数据的全局结构**，能快速削减较高维度带来的冗余信息（**去噪**），而且**有一定的可解释性**（即所谓的主成分），但不适用于展现数据的非线性结构，而且降到非常低的维度（如 10 维以内）的效果一般；
* `t-SNE`属于非线性降维算法，**更倾向于保留数据的局部结构**（由困惑度控制），可视化效果常常**有较好的分离度**，但是时间成本相对较高（本实验 400 样本规模单次运行约 2 分钟），**可解释性不足**，而且同一数据集降到不同维度需要多次训练（不像`PCA`那样运行一次得到特征值和特征向量按需取用）；
* 因此，通常可以先用 PCA 算法对超高维数据进行预降维，快速削减维度大小，然后再通过 t-SNE 算法进行更加细致的降维，已达到能够可视化的程度，这种方法可以很好地权衡降维效果与时间开销。

## 附录

详细代码内容预览如下：

<iframe
	src='https://pastonce.github.io/data_visualization/homework2/homework2'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>